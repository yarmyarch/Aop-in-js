Aop-in-js
=========
### Install
    npm install js_aop
### Descriptions
An tool that applies Aspect Orinted Programming in javascript, can be used creating mocks easily.

For each aspect that added, a <b>Strategy</b> could be choosen, while it's digits in Binary:

    <AopUtil.ALLOW_IN, 0000000X>
        0 - No in (Default Value);
        1 - Allow in;
    <AopUtil.ALLOW_OUT, 000000X0>
        0 - No out (Default Value);
        1 - Allow out;
    <AopUtil.RETURN_AS_ARGUMENTS, 00000X00>
        0 - Returned value be used as the first parameter;
        1 - Returned value be used as arguments;
    <AopUtil.FORCE_QUIT, 0000X000>
        0 - Do nothing.
        1 - Force quit;

Note that the original functions is always set with strategy 3, meaning "Allow in" and "Allow out", while advices are set with 0 to all bits by default.
```js
// Applying a strategy:
AopUtil.before(obj, funcName, advice,
  AopUtil.ALLOW_IN +
  AopUtil.ALLOW_OUT +
  AopUtil.RETURN_AS_ARGUMENTS +
  AopUtil.FORCE_QUIT // + ...
);
```

#### No In

This aspect will only accept the original input (when the function is called) as parameter.

#### Allow In

This aspect will accept the latest returned value (from the aspect before it) as parameter.

#### No Out

The returned value of the current advice would be ignored.

#### Returned as parameter

Only useful when ALLOW_OUT set true. The returned value of this advice would be wrapped as an element of an array, so the next advice only receives 1 parameter.

#### Returned as arguments

Only useful when ALLOW_OUT set true. The returned value of this advice would be used as 'arguments' directly by the next advice.

#### Force quit

The advice chain ends here and returns, all other mocks after this advice would be ignored.

### Usage


```js
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
AopUtil.before(obj, funcName, advice[, strategy]);

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
AopUtil.after(obj, funcName, advice[, strategy]);

/**
 * Clear all advices bind to target function.
 *
 * @param {Object} obj - Object that was mocked.
 * @param {String} funcName - The name of the mocked function.
 */
AopUtil.clearAdvice(obj, funcName);

/**
 * Applies an set of 'Advices' to the target object. It applies functions defined in 'aspect' to the target object
 * using specific rules. If a function defined in target exists in 'aspect', the aspect would be used before (or
 * after regarding to the rules given) the target function. If it not exist, the aspect would be applied directly
 * as a function of the target.
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
AopUtil.applyAspect(target, aspect[, rule[, strategy]]);

/**
 * Remove all advices bind to a target.
 *
 * @param {Object} target - Target that's bind with aspects.
 */
AopUtil.clearAspect(target);
```

### Demo
#### Basic Before and After
```
var AopUtil = require('js_aop');

var obj = {};
obj.demo = function(a, b) {
  console.log('demo')
  return a - b;
}

AopUtil.before(obj, 'demo', function(a, b) {
    console.log('before demo');
    // [a * 2, b] would be injected as agrument list to the next advice (or the original function)
    return [a * 2, b];
}, AopUtil.ALLOW_OUT + AopUtil.RETURN_AS_ARGUMENTS);

AopUtil.after(obj, 'demo', function(result) {
    // receives 1 param only from the original function.
    console.log('after demo');
    return result * 2;
}, AopUtil.ALLOW_IN + AopUtil.ALLOW_OUT);
```
#### Aspects
```js
var beforeAspect = {
  value: 'Nothing to do with this guy',
  demo: function(value) {
    console.log('before advice applied');
    return value;
  },
  test: function(value) {
    console.log('advice added: ' + value);
    return value;
  }
}
AopUtil.applyAspect(obj, beforeAspect);

var afterAspect = {
  demo: function(value) {
    console.log('after advice applied');
    return value;
  }
}
AopUtil.applyAspect(obj, afterAspect, 'after');
```
#### Aspects with rules and strategies
```js
var afterAspect2 = {
  demo: function(value) {
    console.log('after advice with strategy ALLOW_IN applied: ' + value);
    return value;
  }
}
AopUtil.applyAspect(obj, afterAspect2, {
  demo: 'after'
}, {
  demo: AopUtil.ALLOW_IN
});
```
#### All together
```js
obj.demo(1,1);
// before aspect applied
// before demo
// demo
// after demo
// after aspect applied
// after aspect with strategy ALLOW_IN applied: 2
// Final result of demo: (1 * 2 - 1) * 2

obj.test(1);
// advice added: 1

AopUtil.clearAspect(obj);
console.log(obj.demo(1,1)); // 0
console.log(obj.test); // undefined
```