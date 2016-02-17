'use strict';

var AopUtil = (function() {

  var self;
  
  var LC = {
    DEFAULT_RULE: 'before'
  };
    
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
    
  var createProxyMethod = function(originalItem) {
    return function() {
      
      var currentArg = arguments;
      var currentReturn = arguments;
      var lastReturn = arguments;

      var isInAllowed, isOutAllowed;
      
      var advice, method, fromOriginal = 0;
      
      for (var i in originalItem.adviceChain) {
        
        advice = originalItem.adviceChain[i];
        method = advice.method;
        
        // Reading the strategy code in to binary.
        // TODO:Yujia - well actually the ugly 'ACTION_QUIT' can simply be a new strategy.
        isInAllowed = advice.strategy;        
        isOutAllowed = isInAllowed >> 1;
        
        isInAllowed = isInAllowed - (isInAllowed >> 1 << 1);
        isOutAllowed = isOutAllowed - (isOutAllowed >> 1 << 1);
        
        if (isInAllowed) {
          currentArg = lastReturn;
        } else {
          currentArg = arguments;
        }
        if (fromOriginal) {
          currentArg = [currentArg];
          fromOriginal = 0;
        }
        
        currentReturn = method.apply(this, currentArg);
        
        // if it's returned from the original function, give it a wrap to prevent error.
        if (method == originalItem.backup) {
          fromOriginal = 1;
        }
        
        // Taking care of actions. We currently have only 1 action available.
        if (currentReturn == self.ACTION_QUIT) {
          break;
        }
        
        if (isOutAllowed) {
          lastReturn = currentReturn;
        }
      }
      return lastReturn;
    };
  };
    
  var attachToAop = function(obj, methodName, strategy) {
    var sourceMethod = obj[methodName];
    if (!sourceMethod) {
      return;
    }
    
    // Initializing the advice chain.
    var aspect = {};
    aspect.obj = obj;
    aspect.beforeCount = 0;
    aspect.backup = sourceMethod;
    aspect.adviceChain = [{method : sourceMethod, strategy : strategy}];
    
    aspects[methodName] = aspects[methodName] || [];
    aspects[methodName].push(aspect);
    obj[methodName] = createProxyMethod(aspect);
    
    return aspect;
  };

  return self = {
    ALLOW_IN: 1,
    ALLOW_OUT: 2,
    // QuitAction: whenever the advice chain returned this label, ends the chain immediately and ignores all remaining
    // functions. The whole chain returns the last legal returned value.
    ACTION_QUIT: "Aop_" + Math.floor(Math.random()*1000000).toString(36),
    
    /**
     * Adds a 'before' aspect that would be executed before the original defined function body applied.
     *
     * @param {Object} obj - Object that would be mocked.
     * @param {String} funcName - The name of the mocked function.
     * @param {Function} callback - Function that receives the proper params as input, while the arguments received depends on strategy used.
     * @param {int} [strategy] - Optional. Strategy that could be 1 of the 5 types:
     *     0 - (00 in Binary) No in, No out (Default);
     *     1 - (01 in Binary) Allow in, No out;
     *     2 - (10 in Binary) No in, Allow out;
     *     3 - (11 in Binary) Allow in, Allow out.
     */
    before: function(obj, methodName, command, strategy) {
      
      aspects[methodName] = aspects[methodName] || [];
      var objIndex = getAspectIndex(obj, methodName),
          aspect = aspects[methodName][objIndex];
      
      if (objIndex == -1) {
        aspect = attachToAop(obj, methodName, 3);
      }
      aspect.adviceChain.splice(
        aspect.beforeCount, 0, {
        method : command,
        // Default strategy: using original parameters, returned value won't be parsed into the next advice.
        strategy : (strategy ? strategy : 0)
      });
      ++aspect.beforeCount;
    },

    /**
     * Add an 'after' aspect that would be executed after the original defined function body applied.
     *
     * @param {Object} obj - Object that would be mocked.
     * @param {String} funcName - The name of the mocked function.
     * @param {Function} callback - Function that receives the proper params as input, while the arguments received depends on strategy used.
     * @param {int} [strategy] - Optional. Strategy that could be 1 of the 5 types:
     *     0 - (00 in Binary) No in, No out (Default);
     *     1 - (01 in Binary) Allow in, No out;
     *     2 - (10 in Binary) No in, Allow out;
     *     3 - (11 in Binary) Allow in, Allow out.
     */
    after: function(obj, methodName, command, strategy) {
      
      aspects[methodName] = aspects[methodName] || [];
      var objIndex = getAspectIndex(obj, methodName),
          aspect = aspects[methodName][objIndex];
      
      // The original function always receives the last return as input, and always push its returned value as a legal output.
      if (objIndex == -1) {
        aspect = attachToAop(obj, methodName, 3);
      }
      aspect.adviceChain.push({
        method : command,
        strategy : (strategy ? strategy : 0)
      });
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
     * Applies an set of 'Advices' to the target object. It applies functions defined in 'aspect' to the target object
     * using specific rules. If a function defined in target exists in 'aspect', the aspect would be used before (or
     * after regarding to the rules given) the target function. If it not exist, the aspect would be applied directly
     * as a function of the target.
     *
     * @param {Object} target - Target to which those advices would be applied.
     * @param {Object<String, Function>} aspect - An object containing set of functions that would be used as advices.
     * @param {[String]|[Object<String, String>]} rule - Optinal. Rules to be used. Can be 'before', 'after' or anything
     *   else that's supported. If given as an Object, it should define rules specifically for each aspect. Using
     *   'before' for default, meaning the aspect would be executed before the target function.
     *
     * @return {Object} - The updated target.
     */
    applyAspect: function(target, aspect, rule) {
      Object.keys(aspect).forEach(function(funcName) {
        // Do nothing to attributes that's not a function.
        if (!aspect[funcName] instanceof Function) {
          return;
        }

        var realRule = rule instanceof Object && rule[funcName] || rule;
        realRule = MockUtil[realRule] && realRule || LC.DEFAULT_RULE;

        if (target.hasOwnProperty(funcName)) {
          if (!target[funcName] instanceof Function) {
            return;
          }
          self[realRule](target, funcName, aspect[funcName]);
        } else {
          target[funcName] = aspect[funcName];
        }
      });
      return target;
    },

    /**
     * Remove all advices bind to a target.
     * @param {Object} target - Target that's bind with aspects.
     */
    clearAspect: function(target) {
      Object.keys(target).forEach(function(funcName) {
        if (!target[funcName] instanceof Function) {
          return;
        }
        self.clearAdvice(target, funcName);
      });
    }
  };

})();

module && module.exports = AopUtil;
