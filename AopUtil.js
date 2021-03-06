'use strict';

var AopUtil = (function() {

  var self;
  
  var LC = {
    DEFAULT_RULE: 'before',
    STRATEGY_GROUP: {
      ALLOW_IN: 0,
      ALLOW_OUT: 1,
      // Sets if the returned array could be used as arguments directly.
      RETURN_AS_ARGUMENTS: 2,
      FORCE_QUIT: 3,
    }
  };
  
  var randCode = '_ri' + parseInt((Math.random() + '').substr(2)).toString(36);
  
  var aspects = {};

  /**
   * Gets the index for an object within all aspects that's having the same methodName.
   * @return -1 if not found, otherwise the index starts from 0.
   */
  var getAspectIndex = function(obj, methodName) {
    if (!aspects[methodName] || !aspects[methodName].length) {
      return -1;
    }
    for (var i = 0, aspect; aspect = aspects[methodName][i]; ++i) {
      if (aspect.obj == obj) {
        return i;
      }
    }
    return -1;
  };
  
  var getStrategyArray = function(strategy) {
    var strategyArr = [];
    var newStrategy;
    strategy += 0;
    while(strategy) {
      strategyArr.push(strategy - ((newStrategy = strategy >> 1) << 1));
      strategy = newStrategy;
    }
    return strategyArr;
  };

  var getAdviceChain = function(obj, methodName) {
    aspects[methodName] = aspects[methodName] || [];
    var objIndex = getAspectIndex(obj, methodName),
        aspect = aspects[methodName][objIndex];

    if (objIndex == -1) {
      aspect = attachToAop(obj, methodName, 3);
    }
    return aspect.adviceChain;
  };
    
  var createProxyMethod = function(originalItem) {
    return function() {
      var lastReturn = randCode;
      var lastReturnedAsArguments = false;
      
      for (var i = 0, advice; advice = originalItem.adviceChain[i]; ++i) {
        var method = advice.method;
        if (!(method instanceof Function)) continue;
        var strategyArr = getStrategyArray(advice.strategy);

        var args = strategyArr[LC.STRATEGY_GROUP.ALLOW_IN] && (lastReturn != randCode) && 
            (lastReturnedAsArguments ? lastReturn : [lastReturn]) || arguments;
        var currentReturn = method.apply(this, args);
        
        lastReturnedAsArguments = strategyArr[LC.STRATEGY_GROUP.RETURN_AS_ARGUMENTS];
        strategyArr[LC.STRATEGY_GROUP.ALLOW_OUT] && (lastReturn = currentReturn);

        if (strategyArr[LC.STRATEGY_GROUP.FORCE_QUIT]) {
          break;
        }
      }
      return (lastReturn != randCode) && lastReturn || undefined;
    };
  };
    
  var attachToAop = function(obj, methodName, strategy) {
    // Can't use 'hasOwnProperty' as we'll miss functions defined from prototype.
    // I hate prototype-style-class-defination.
    if (obj[methodName] === undefined) {
      obj[methodName] = randCode;
    }
    var sourceMethod = obj[methodName];
    // We allow it's not defined. In this case we set it blank and add advices to be applied directly.
    if (!(sourceMethod instanceof Function) && sourceMethod !== randCode) {
      return;
    }
    
    // Initializing the advice chain.
    var aspect = {      
      obj: obj,
      backup: sourceMethod,
      adviceChain: [{
        method : sourceMethod, strategy : strategy
      }]
    };
    
    aspects[methodName] = aspects[methodName] || [];
    aspects[methodName].push(aspect);
    obj[methodName] = createProxyMethod(aspect);
    
    return aspect;
  };

  self = {
    /**
     * Adds a 'before' advice that would be executed before the original defined function body applied. Note that when
     * multiple 'before' advices added, those ones added afterwards would be executed in advance.
     *
     * @param {Object} obj - Object that would be mocked.
     * @param {String} funcName - The name of the mocked function.
     * @param {Function} advice - Function that receives the proper params as input, while the arguments received
     *   depends on strategy used.
     * @param {int} [strategy] - Optional, the strategy code.
     */
    before: function(obj, methodName, advice, strategy) {
      var chain = getAdviceChain(obj, methodName);
      chain.unshift({
        method : advice,
        // Default strategy: using original parameters, returned value won't be parsed into the next advice.
        // Set the strategy to 3 if it's the first advice attached before an nonexsiting function name.
        strategy : chain[0].method == randCode ? 3 : (strategy || 0)
      });
    },

    /**
     * Add an 'after' advice that would be executed after the original defined function body applied. Note that when
     * multiple 'after' advices added, those ones added afterwards would be executed later.
     *
     * @param {Object} obj - Object that would be mocked.
     * @param {String} funcName - The name of the mocked function.
     * @param {Function} advice - Function that receives the proper params as input, while the arguments received
     *   depends on strategy used.
     * @param {int} [strategy] - Optional, the strategy code.
     */
    after: function(obj, methodName, advice, strategy) {
      var chain = getAdviceChain(obj, methodName);
      chain.push({
        method : advice,
        strategy : chain[chain.length - 1].method == randCode ? 3 : (strategy || 0)
      });
    },

    /**
     * Gets the original function without any advices appended. Return the function itself if it's never mocked.
     *
     * @param {Object} obj - Object that was mocked.
     * @param {String} funcName - The name of the mocked function.
     *
     * @return {Function} - The original function with 'this' bind to obj.
     */
    getOrigin: function(obj, methodName) {
      var aspectIndex = getAspectIndex(obj, methodName);
      if (aspectIndex === -1 && obj[methodName] instanceof Function) {
        return obj[methodName].bind(this);
      }
      var backup = aspects[methodName][aspectIndex].backup;
      return backup.bind && backup.bind(obj) || backup;
    },

    /**
     * Clear all advices bind to target function.
     *
     * @param {Object} obj - Object that was mocked.
     * @param {String} funcName - The name of the mocked function.
     */
    clearAdvice: function(obj, methodName) {
      var objIndex = getAspectIndex(obj, methodName),
          aspect = aspects[methodName][objIndex];
      
      if (objIndex != -1) {
        obj[methodName] = aspect.backup;
        aspects[methodName].splice(objIndex, 1);
      }
    },
    
    /**
     * Applies an set of 'advice' to the target object. It applies functions defined in 'aspect' to the target object
     * using specific rules. If a function defined in target exists in 'aspect', the advice would be used before (or
     * after regarding to the rules given) the target function. If it not exist, the advice would be applied directly
     * as a function of the target. If the advice given is the last 'before' or the first 'after' to an non-exsiting
     * function name, it would be applied with strategy 3 by force so it acts like the default function when it exists.
     *
     * @param {Object} target - Target to which those advices would be applied.
     * @param {Object<String, Function>} aspect - An object containing set of functions that would be used as advices.
     * @param {String|Object<String, String>} [rule] - Optinal. Rules to be used. Can be 'before', 'after' or anything
     *   else that's supported. If given as an Object, it should define rules specifically for each advice. Using
     *   'before' for default, meaning the aspect would be executed before the target function.
     * @param {Integer|Object<String, Integer>} [strategy] - Optinal. Strategies to be used. Can be anything supported.
     *   If an Object given, it should define strategies specifically for each advice. Using 0 for default.
     *
     * @return {Object} - The updated target.
     */
    applyAspect: function(target, aspect, rule, strategy) {
      Object.keys(aspect).forEach(function(funcName) {
        // Do nothing to attributes that's not a function.
        if (!(aspect[funcName] instanceof Function)) {
          return;
        }

        var realRule = rule instanceof Object ? rule[funcName] : rule;
        realRule = self[realRule] && realRule || LC.DEFAULT_RULE;

        // Default strategy for advices is no in, no out, and do nothing.
        var realStrategy = (strategy instanceof Object ? strategy[funcName] : strategy) || 0;

        self[realRule](target, funcName, aspect[funcName], realStrategy);
      });
      return target;
    },

    /**
     * Remove all advices bind to a target.
     *
     * @param {Object} target - Target that's bind with aspects.
     */
    clearAspect: function(target) {
      Object.keys(target).forEach(function(funcName) {
        if (!target[funcName] instanceof Function) {
          return;
        }
        self.clearAdvice(target, funcName);
        target[funcName] === randCode && (delete target[funcName]);
      });
    }
  };

  // Adding constants to be used for strategy shortcuts.
  Object.keys(LC.STRATEGY_GROUP).forEach(function(key) {
    self[key] = 1 << LC.STRATEGY_GROUP[key];
  });

  return self;
})();

module.exports = AopUtil;
