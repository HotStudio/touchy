# Touchy

Touchy is a jQuery plugin for managing touch events on W3C-compliant browsers, such as Mobile Safari or Android Browser, or any browser that supports the ontouchstart, ontouchmove and ontouchend events.

It creates new custom events that a programmer may utilize at a high level, such as "touchy-pinch" and "touchy-rotate" among others, and thus avoid the low-level work of combining touch and gesture events to achieve these common gestural controls.

The minified file size is 9.43KB (2.69KB gzipped).

## Log ##

* April 11, 2013
  * Version 1.1
  * Added preventDefault options for the three phases: start, move, end.
  * Condensed the code a bit, shaving 0.05kb off the gzip size.
  * Fixed the wheel rotation examples, which had some bad CSS syntax in them.
* August 8, 2012
  * Rotation velocity may now return negative values
* August 3, 2012
  * Fixed backwards compatibility to support jQuery back to version 1.4.2
* July 11, 2012
  * Added test pages to the repository
* September 6, 2011
  * Touchy released at the San Francisco JavaScript Meetup
* August 1, 2011
  * Formal work on Touchy began, drawing upon earlier prototypes.

## Example Usage

First, load Touchy after jQuery.  Touchy requires jQuery 1.4.2+.

```html
<body>
    <!-- content -->
    <script src="//ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js"></script>
    <script src="path/to/my/js/jquery.touchy.js"></script>
</body>
```

Then bind a Touchy event to a handler.

```javascript
var handleTouchyPinch = function (e, $target, data) {
    $target.css({'webkitTransform':'scale(' + data.scale + ',' + data.scale + ')'});
};
$('#my_div').bind('touchy-pinch', handleTouchyPinch);
```

## Touchy Events

Touchy currently enables the use of the following events:

* touchy-longpress
* touchy-drag
* touchy-pinch
* touchy-rotate
* touchy-swipe

These events are triggered by user interactions with a specific "phase" of the user's gesture passed to the event handler.  A touchy-drag event, for example, will be triggered when the user first touches the bound element, when the user drags his or her finger across the screen, and when the user stops touching the screen.

The events are all prefixed with "touchy-" to avoid name collision.

## Data Passed to Event Handlers

The general pattern of the arguments passed to an event handler is as follows:

```javascript
handleTouchyEvent(event, phase, $target, data);
```

* event (Object) - a jQuery event object.
* phase (String) - the phase of the user gesture: "start", "move", "end".
* $target (Object) - a jQuery object wrapping the event target
* data (Object) - a JSON object with additional information about the user gesture.

However, there are exceptions to this pattern.  Please see below.

### touchy-longpress

phase: "start" or "end"
(No data object)

### touchy-drag

phase: "start", "move" or "end"

data:

* movePoint
* lastMovePoint
* startPoint
* velocity

Points are JSON objects containing "x" and "y" pixel-based properties, relative to the page.
Velocity is the distance / time measured in pixels and milliseconds, based on the last two ontouchmove events.

### touchy-pinch

(No phase.  All events are essentially within the "move" phase.)

data:

* scale
* previousScale
* currentPoint
* startPoint
* startDistance

Scale is the percentage of the current distance between the two fingers, relative to the start distance.
Points are JSON objects containing "x" and "y" pixel-based properties, relative to the page.
The startDistance is measured in pixels.

### touchy-rotate

phase: "start", "move" and "end"

data:

* startPoint
* startDate ("move" and "end" phase only)
* movePoint
* lastMovePoint
* degrees
* degreeDelta ("move" and "end" phase only)
* velocity

Points are JSON objects containing "x" and "y" pixel-based properties, relative to the page.
Velocity is the distance / time measured in pixels and milliseconds, based on the last two ontouchmove events.

### touchy-swipe

(No phase.  Swipe triggers only once.  See configurations.)

data:

* direction: "left", "right", "up", "down"
* movePoint
* lastMovePoint
* startPoint
* velocity

Points are JSON objects containing "x" and "y" pixel-based properties, relative to the page.
Velocity is the distance / time measured in pixels and milliseconds, based on the last two ontouchmove events.

## Overriding Default Configuration Settings

Touchy configurations are stored within the bound element's jQuery data object.  One may override default configurations by assigning new values to properties within the data object after the element is bound to a touchy event.

Example:

```javascript
$('#my_div').bind('touchy-rotate', handleTouchyRotate);
$('#my_div').data('touchyRotate').settings.requiredTouches = 2;
```

As shown in the example, the settings are accessed through the camelCased name of the event.  All events except touchy-pinch require one finger touch by default, but may be configured to require more.

### touchy-longpress

* requiredTouches: 1
* msThresh: 800 (the number of milliseconds the user must touch the element before the event is fired)
* triggerStartPhase: false (whether to trigger the event during the start phase)

### touchy-drag

* requiredTouches: 1
* msHoldThresh: 100 (a threshold before engaging drag, to avoid conflict with tapping gestures)

### touchy-pinch

* pxThresh: 0 (a pixel-based distance threshold that may be used to prevent the event from firing)

### touchy-rotate

* requiredTouches: 1

### touchy-swipe

* requiredTouches: 1
* velocityThresh: 1 (required velocity to fire the event)
* triggerOn: "touchmove" (or "touchend".  By default, as soon as the velocity is reached, the event fires.)

## Using event delegation

By default, Touchy events are **not** able to be bound on ancestors of the target elements in a typical "event delegation" design pattern.  One may configure Touchy to do this, but unlike normal event delegation, it is computationally expensive.

To use event delegation:

```javascript
$.touchyOptions.useDelegation = true;
```

Note that this is a global operation affecting all Touchy events.


**enjoy!**


