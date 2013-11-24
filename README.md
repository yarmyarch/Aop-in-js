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

###### No In

This aspect will only accept the original input (when the function is called) as parameter.

###### Allow In

This aspect will accept the latest returned value (from the aspect before it) as parameter.

###### No Out

The returned value of the current aspect would be ignored.

###### Allow Out

This aspect will return it's returned value for next usage (input to the next aspect or the final returned value if the current aspect is the last one).

### Public functions

###### AopUtil.before
Add a before aspect that would be executed before the original defined function body applied.
    
	AopUtil.before(functionName, callback, [stratage]);
    functionName : {String} public name of the function that would be hacked. It should be able to be reached from the putlic namespace.
    callback</b> : {Function(arguments)} funciton that receives the original params as input.
    stratage : {int} values below:
        0 - (00 in Binary) No in, No out (Default);
        1 - (01 in Binary) Allow in, No out;
        2 - (10 in Binary) No in, Allow out;
        3 - (11 in Binary) Allow in, Allow out.

###### AopUtil.after
Add a after aspect that would be executed after the original defined function body applied.
    
	AopUtil.after(functionName, callback, [stratage]);
    functionName : {String} public name of the function that would be hacked. It should be able to be reached from the putlic namespace.
    callback : {Function(arguments)} funciton that receives the proper params as input. Arguments received depends on current stratage.
    stratage : {int} values below:
        0 - (00 in Binary) No in, No out (Default);
        1 - (01 in Binary) Allow in, No out;
        2 - (10 in Binary) No in, Allow out;
        3 - (11 in Binary) Allow in, Allow out.

###### AopUtil.clearAdvice
Clear all binded advices.

    AopUtil.clearAdvice(functionName);
    functionName : {String} public name of the function that is hacked. It should be able to be reached from the putlic namespace.