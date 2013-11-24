Aop-in-js
=========

### Descriptions
An tool that applies aspect orinted programming in javascript.

For each aspect that added, a <b>Stratage</b> could be choosen, while it's currently 2 digit in Binary:

    <First Byte> 
        0 - No in (Default Value);
        1 - Allow in;
    <Second Byte> 
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

### Public functions

#### AopUtil.before
Add a before aspect that would be executed before the original defined function body applied.

```js
// usage
AopUtil.before(functionName, callback[, stratage]);

// params
functionName : 
    {String} public name of the function that would be hacked. 
    It should be able to be reached from the putlic namespace.
callback : 
    {Function(arguments)} funciton that receives the proper params as input. 
    Arguments received depends on current stratage.
[stratage] : 
    {int} optional. Values below
    0 - (00 in Binary) No in, No out (Default);
    1 - (01 in Binary) Allow in, No out;
    2 - (10 in Binary) No in, Allow out;
    3 - (11 in Binary) Allow in, Allow out.
```

#### AopUtil.after
Add a after aspect that would be executed after the original defined function body applied.
    
```js
// usage
AopUtil.after(functionName, callback[, stratage]);

// params
functionName : 
    {String} public name of the function that would be hacked. 
    It should be able to be reached from the putlic namespace.
callback : 
    {Function(arguments)} funciton that receives the proper params as input. 
    Arguments received depends on current stratage.
[stratage] : 
    {int} optional. Values below:
    0 - (00 in Binary) No in, No out (Default);
    1 - (01 in Binary) Allow in, No out. 
        Note that the first advice that is behind the orginal function which allows input always received 1 param;
    2 - (10 in Binary) No in, Allow out;
    3 - (11 in Binary) Allow in, Allow out.
```

#### AopUtil.clearAdvice
Clear all binded advices.

```js
// usage
AopUtil.clearAdvice(functionName);

// params
functionName : 
    {String} public name of the function that is hacked. 
    It should be able to be reached from the putlic namespace.