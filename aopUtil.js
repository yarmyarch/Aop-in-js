var AopUtil = {};
	
(function() {
	
AopUtil.ALLOW_IN = 1;

AopUtil.ALLOW_OUT = 2;
	
//QuitAction处理 当接收到一个return为Action_quit时，强制中断后续所有的Aspect
AopUtil.ACTION_QUIT = "Aop_" + Math.floor(Math.random()*1000000).toString(36);
	
var original = {};
	
var beforeAdviceCounter = {};
	
var createProxyMethod = function(originalItem) {
	return function() {
		
		var currentArg = arguments;
		var currentReturn = arguments;
		var lastReturn = arguments;
		
		//计算组合策略（参数+返回值策略）中的参数策略
		//isInAllowed为策略值二进制表示中的最低位值，isOutAllowed为次低位，isQuit为第三位
		var isInAllowed, isOutAllowed, isQuit;
		
		var advice, method, fromOriginal = 0;
		
		for (var i in originalItem.adviceChain) {
			
            advice = originalItem.adviceChain[i];
            method = advice.method;
            
			//读取策略组
			isInAllowed = advice.strategy;				
			isOutAllowed = isInAllowed >> 1;
			
			isInAllowed = isInAllowed - (isInAllowed >> 1 << 1);
			isOutAllowed = isOutAllowed - (isOutAllowed >> 1 << 1);
			
			if (isInAllowed) currentArg = lastReturn;
			else currentArg = arguments;
            
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
			if (currentReturn == AopUtil.ACTION_QUIT) break;
			
			if (isOutAllowed) lastReturn = currentReturn;
		}
		return lastReturn;
	}
}
	
var attachToAop = function(methodName, strategy) {
	
	//忽略重复校验，因为如下场景会导致问题：
	//  对iframe中某方法添加aop；
	//  iframe改变src，需要重新添加aop，此时则会添加失败。
	//~ if (original[methodName])  {
		//~ return null;
	//~ }
	var sourceMethod = eval(methodName);
	if (!sourceMethod) return null;
	
	beforeAdviceCounter[methodName] = 0;
	//初始化adviceChain
	original[methodName] = {};
	original[methodName].backup = sourceMethod;
	original[methodName].adviceChain = [{method : sourceMethod, strategy : strategy}];
	eval(methodName  + " = createProxyMethod(original[methodName])");
}

AopUtil.before = function(methodName, command, strategy) {
	
	if (!original[methodName] || original[methodName].backup != eval('(' + methodName + ')')) attachToAop(methodName, 3);
	original[methodName].adviceChain.splice(
		beforeAdviceCounter[methodName], 0, {
		method : command,
		//默认以原始参数输入，不允许输出
		strategy : (strategy ? strategy : 0)
	});
	++beforeAdviceCounter[methodName];
}

AopUtil.after = function(methodName, command, strategy) {
	
	//原始函数两端全开
	if (!original[methodName] || original[methodName].backup != eval('(' + methodName + ')')) attachToAop(methodName, 3);
	original[methodName].adviceChain.push({
		method : command,
		//默认以原始参数输入，不允许输出
		strategy : (strategy ? strategy : 0)
	});
}

AopUtil.clearAdvice = function(methodName) {
	
	if (original[methodName]) {
		eval(methodName + "= original[methodName].backup");
		original[methodName] = null;
	}
}

})();