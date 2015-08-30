var AopUtil = (function() {

  var self;
    
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
      
      //计算组合策略（参数+返回值策略）中的参数策略
      //isInAllowed为策略值二进制表示中的最低位值，isOutAllowed为次低位，isQuit为第三位
      var isInAllowed, isOutAllowed;
      
      var advice, method, fromOriginal = 0;
      
      for (var i in originalItem.adviceChain) {
        
        advice = originalItem.adviceChain[i];
        method = advice.method;
        
        //读取策略组
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
        
        //Action处理
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
    
    //初始化adviceChain
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
    //QuitAction处理 当接收到一个return为Action_quit时，强制中断后续所有的Aspect
    ACTION_QUIT: "Aop_" + Math.floor(Math.random()*1000000).toString(36),
    
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
        //默认以原始参数输入，不允许输出
        strategy : (strategy ? strategy : 0)
      });
      ++aspect.beforeCount;
    },

    after: function(obj, methodName, command, strategy) {
      
      aspects[methodName] = aspects[methodName] || [];
      var objIndex = getAspectIndex(obj, methodName),
          aspect = aspects[methodName][objIndex];
      
      //原始函数两端全开
      if (objIndex == -1) {
        aspect = attachToAop(obj, methodName, 3);
      }
      aspect.adviceChain.push({
        method : command,
        //默认以原始参数输入，不允许输出
        strategy : (strategy ? strategy : 0)
      });
    },

    clearAdvice: function(obj, methodName) {
      
      var objIndex = getAspectIndex(obj, methodName),
          aspect = aspects[methodName][objIndex];
      
      if (objIndex != -1) {
        obj[methodName] = aspect.backup;
        aspects[methodName].splice(objIndex, 1);
      }
    }
  };

})();