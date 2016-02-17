Aop-in-js
=========
### Install
    npm install js_aop
### Descriptions
An tool that applies Aspect Orinted Programming in javascript, can be used creating mocks easily.

Check index.html for a demo.

For each aspect that added, a <b>Strategy</b> could be choosen, while it's currently 2 digit in Binary:

    <First Bit> 
        0 - No in (Default Value);
        1 - Allow in;
    <Second Bit> 
        0 - No out (Default Value);
        1 - Allow out;

Note that the original functions is always set with "Allow in" and "Allow out", while advices are set "No in", "No out" defaultly.

#### No In

This aspect will only accept the original input (when the function is called) as parameter.

#### Allow In

This aspect will accept the latest returned value (from the aspect before it) as parameter.

#### No Out

The returned value of the current aspect would be ignored.

#### Allow Out

This aspect will return it's returned value for next usage (input to the next aspect or the final returned value if the current aspect is the last one).

### Usage


```js
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
AopUtil.before(obj, funcName, callback[, strategy]);

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
AopUtil.after(obj, funcName, callback[, strategy]);

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
 * @param {[String]|[Object<String, String>]} rule - Optinal. Rules to be used. Can be 'before', 'after' or anything
 *   else that's supported. If given as an Object, it should define rules specifically for each aspect. Using
 *   'before' for default, meaning the aspect would be executed before the target function.
 *
 * @return {Object} - The updated target.
 */
AopUtil.applyAspect(target, aspect[, rule]);

/**
 * Remove all advices bind to a target.
 * @param {Object} target - Target that's bind with aspects.
 */
AopUtil.clearAspect(target);
```

### Demo
```
var AopUtil = require('js_aop');

var obj = {};
obj.demo = function(a, b) {
    return a - b;
}

AopUtil.before(obj, 'demo', function(a, b) {
    console.log(0);
    // [a * 2, b] would be injected as agrument list to the next advice (or the original function)
    return [a * 2, b];
}, 2);

AopUtil.after(obj, 'demo', function(result) {
    // receives 1 param only from the original function.
    console.log(1);
    return result * 2;
}, 1);

obj.demo(1,1);
// 0
// 1
// return (1 * 2 - 1) * 2
```