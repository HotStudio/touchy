/* Touchy : a jQuery plugin for managing touch events in Webkit
 *
 * version: 1.1
 *
 * requires jQuery 1.4.2+
 */

(function($){

    // public jQuery properties
    $.touchyOptions = {
        /*
         * To be implemented
         *
        press: { // the user touches the element before further interaction.  maybe abstracts touchstart and mousedown?
            requiredTouches: 1,
            data: {},
            proxyEvents: [TouchStart, TouchEnd]
        },
        contact: { // the user touches the element at any time during the interaction.  could fire mouseenter as well as its own event, if configured to do so?
            requiredTouches: 1,
            triggerMouseEnter: false,
            data: {},
            proxyEvents: [TouchStart, TouchMove, TouchEnd]
        },
        tap: { // the user taps briefly on the element as the only interaction.  can interrelate with doubletap.
            requiredTouches: 1,
            msThreshTap: 200,
            data: {},
            proxyEvents: [TouchStart, TouchEnd]
        },
        dbltap: { // the user taps twice within a short period of time on the element as the only interaction.
            requiredTouches: 1,
            msThreshTap: 200,
            msThreshDouble: 500,
            data: {},
            proxyEvents: [TouchStart, TouchEnd]
        },
        */
        longpress: { // the user touches the element and hold his or her finger on the element for a specifed amount of time.
            requiredTouches: 1,
            msThresh: 800,
            triggerStartPhase: false,
            data: {
                startDate: null
            },
            proxyEvents: ["TouchStart", "TouchEnd"]
        },
        drag: { // the user touches the element and then moves his or her finger across the screen
            requiredTouches: 1,
            msHoldThresh: 100,
            data: {
                startPoint: null,
                startDate: null,
                movePoint: null,
                moveDate: null,
                held: false
            },
            proxyEvents: ["TouchStart", "TouchMove", "TouchEnd"]
        },
        pinch: { // the user puts two fingers on the element and then either increases or decreases the distance between them.
            pxThresh: 0,
            data: {
                startPoint: null,
                startDate: null,
                movePoint: null,
                moveDate: null
            },
            proxyEvents: ["TouchStart", "TouchMove", "GestureChange", "TouchEnd"]
        },
        rotate: { // the user attempts to rotate the element within the x/y plane.  may require one or two fingers.
            requiredTouches: 1,
            data: {},
            proxyEvents: ["TouchStart", "TouchMove", "GestureChange", "TouchEnd"]
        },
        swipe: { // the user touches the screen, then rapidly drags his or her finger(s), then stops touching the screen, all in a "flicking" or "swiping" motion.  may require up to four fingers.
            requiredTouches: 1,
            velocityThresh: 1,
            triggerOn: "touchmove",
            data: {
                startPoint: null,
                startDate: null,
                movePoint: null,
                moveDate: null
            },
            proxyEvents: ["TouchStart", "TouchMove", "TouchEnd"]
        }
    };


    // private proxy event handlers

    var proxyHandlers = {

        handleTouchStart: function (e) {

            var eventType = this.context,
                $target = this.target,
                event = e.originalEvent,
                touches = event.targetTouches,
                data;
            event.preventDefault();

            switch (this.context) {

                //////////////// DRAG ////////////////
                case 'drag':
                    data = $target.data('touchyDrag');
                    if (touches.length === data.settings.requiredTouches) {
                        updateDragData(data, touches, e.timeStamp);
                        var startPoint = data.startPoint;
                        $target.trigger('touchy-drag', ['start', $target, {
                            "movePoint":      startPoint,
                            "lastMovePoint":  startPoint,
                            "startPoint":     startPoint,
                            "velocity":       0,
                            "originalEvent":  event,
                            "originalTarget": event.target
                        }]);
                    }
                    break;

                //////////////// SWIPE ////////////////
                case 'swipe':
                    data = $target.data('touchySwipe');
                    if (touches.length === data.settings.requiredTouches) {
                        $.extend(data, {
                            "originalEvent":  event,
                            "originalTarget": event.target
                        });
                        updateSwipeData(data, touches, e.timeStamp);
                    }
                    break;

                //////////////// PINCH ////////////////
                case 'pinch':
                    data = $target.data('touchyPinch');
                    var points = getTwoTouchPointData(e);
                    if(points) {
                        $.extend(data, {
                          "startPoint": {
                              "x": points.centerX,
                              "y": points.centerY
                          },
                          "startDistance": Math.sqrt( Math.pow( (points.x2 - points.x1), 2 ) + Math.pow( (points.y2 - points.y1), 2 ) ),
                          "originalEvent":  event,
                          "originalTarget": event.target
                        });
                    }
                    break;

                //////////////// LONGPRESS ////////////////
                case 'longpress':
                    data = $target.data('touchyLongpress');
                    if (touches.length === data.settings.requiredTouches) {
                        $.extend(data, {
                            "startPoint": {
                                "x": touches[0].pageX,
                                "y": touches[0].pageY
                            },
                            "startDate": e.timeStamp,
                            "originalEvent":  event,
                            "originalTarget": event.target
                        });
                        if (data.settings.triggerStartPhase) {
                            $target.trigger('touchy-longpress', ['start', $target, data]);
                        }
                        data.timer = setTimeout($.proxy(function(){
                            $target.trigger('touchy-longpress', ['end', $target, data]);
                        }, this), data.settings.msThresh);
                    }
                    break;

                //////////////// ROTATE ////////////////
                case 'rotate':
                    data = $target.data('touchyRotate');
                    if (touches.length === data.settings.requiredTouches) {
                        if (touches.length === 1) {
                            ensureSingularStartData(data, touches, e.timeStamp);
                        }
                        else {
                            var points = getTwoTouchPointData(e);
                            $.extend(data, {
                              "startPoint": {
                                  "x": points.centerX,
                                  "y": points.centerY
                              },
                              "startDate": e.timeStamp
                            });
                        }
                        var startPoint = data.startPoint;
                        $target.trigger('touchy-rotate', ['start', $target, {
                            "startPoint": startPoint,
                            "movePoint": startPoint,
                            "lastMovePoint": startPoint,
                            "velocity": 0,
                            "degrees": 0,
                            "originalEvent":  event,
                            "originalTarget": event.target
                        }]);
                    }
                    break;

            }
        },

        handleTouchMove: function (e) {
            var eventType = this.context,
                $target = this.target,
                event = e.originalEvent,
                touches = event.targetTouches,
                data;
            event.preventDefault();

            switch (eventType) {

                //////////////// DRAG ////////////////
                case 'drag':
                    data = $target.data('touchyDrag');
                    if (touches.length === data.settings.requiredTouches) {
                        updateDragData(data, touches, e.timeStamp);
                        var movePoint = data.movePoint,
                            lastMovePoint = data.lastMovePoint,
                            distance = movePoint.x === lastMovePoint.x && movePoint.y === lastMovePoint.y ? 0 : Math.sqrt( Math.pow( (movePoint.x - lastMovePoint.x), 2 ) + Math.pow( (movePoint.y - lastMovePoint.y), 2 ) ),
                            ms = data.moveDate - data.lastMoveDate,
                            velocity = ms === 0 ? 0 : distance / ms;
                        if (data.held) {
                            $target.trigger('touchy-drag', ['move', $target, {
                                "movePoint":      movePoint,
                                "lastMovePoint":  lastMovePoint,
                                "startPoint":     data.startPoint,
                                "velocity":       velocity,
                                "originalEvent":  event,
                                "originalTarget": event.target
                            }]);
                        }
                    }
                    break;

                //////////////// SWIPE ////////////////
                case 'swipe':
                    data = $target.data('touchySwipe');
                    if (touches.length === data.settings.requiredTouches) {
                        updateSwipeData(data, touches, e.timeStamp);

                        if (!data.swipeExecuted && data.swiped && data.settings.triggerOn === 'touchmove') {
                            data.swipeExecuted = true;
                            triggerSwipe(data, $target);
                        }
                    }
                    break;

                //////////////// PINCH ////////////////
                case 'pinch':
                    if (!hasGestureChange()) {
                        data = $target.data('touchyPinch');
                        var points = getTwoTouchPointData(e);
                        if(points){
                            data.currentPoint = {
                                "x": points.centerX,
                                "y": points.centerY
                            };
                            var moveDistance = Math.sqrt( Math.pow( (points.x2 - points.x1), 2 ) + Math.pow( (points.y2 - points.y1), 2 ) ),
                                previousScale = data.previousScale = data.scale || 1,
                                startDistance = data.startDistance,
                                scale = data.scale = moveDistance / startDistance,
                                currentDistance = scale * startDistance;

                            if(currentDistance > data.settings.pxThresh){
                                $target.trigger('touchy-pinch', [$target, {
                                    "scale":         scale,
                                    "previousScale": previousScale,
                                    "currentPoint":  data.currentPoint,
                                    "startPoint":    data.startPoint,
                                    "startDistance": startDistance,
                                    "originalEvent":  event,
                                    "originalTarget": event.target
                                }]);
                            }
                        }
                    }
                    break;

                //////////////// ROTATE ////////////////
                case 'rotate':
                    data = $target.data('touchyRotate');
                    if (touches.length === data.settings.requiredTouches) {
                        var lastMovePoint,
                            lastMoveDate,
                            movePoint,
                            moveDate,
                            lastMoveDate,
                            distance,
                            ms,
                            velocity,
                            targetPageCoords,
                            centerCoords,
                            radians,
                            degrees,
                            lastDegrees,
                            degreeDelta;

                        lastMovePoint = data.lastMovePoint = data.movePoint || data.startPoint;
                        lastMoveDate = data.lastMoveDate = data.moveDate || data.startDate;
                        movePoint = data.movePoint = {
                            "x": touches[0].pageX,
                            "y": touches[0].pageY
                        };
                        moveDate = data.moveDate = e.timeStamp;

                        if (touches.length === 1) {
                            targetPageCoords = data.targetPageCoords = data.targetPageCoords || getViewOffset(e.target);
                            centerCoords = data.centerCoords = data.centerCoords || {
                                "x": targetPageCoords.x + ($target.width() * 0.5),
                                "y": targetPageCoords.y + ($target.height() * 0.5)
                            };
                        }
                        else {
                            var points = getTwoTouchPointData(e);
                                centerCoords = data.centerCoords = {
                                    "x": points.centerX,
                                    "y": points.centerY
                                };
                            if (hasGestureChange()) {
                                break;
                            }

                        }
                        radians = Math.atan2(movePoint.y - centerCoords.y, movePoint.x - centerCoords.x);
                        lastDegrees = data.lastDegrees = data.degrees;
                        degrees = data.degrees = radians * (180 / Math.PI);
                        degreeDelta = lastDegrees ? degrees - lastDegrees : 0;
                        ms = moveDate - lastMoveDate;
                        velocity = data.velocity = ms === 0 ? 0 : degreeDelta / ms;

                        $target.trigger('touchy-rotate', ['move', $target, {
                            "startPoint": data.startPoint,
                            "startDate": data.startDate,
                            "movePoint": movePoint,
                            "lastMovePoint": lastMovePoint,
                            "centerCoords": centerCoords,
                            "degrees": degrees,
                            "degreeDelta": degreeDelta,
                            "velocity": velocity,
                            "originalEvent":  event,
                            "originalTarget": event.target
                        }]);
                    }
                    break;

            }
        },

        handleGestureChange: function (e) {
            var eventType = this.context,
                $target = this.target,
                event = e.originalEvent,
                touches = event.touches,
                data;
            event.preventDefault();

            switch (eventType) {

                //////////////// PINCH ////////////////
                case 'pinch':
                    data = $target.data('touchyPinch');
                    var previousScale = data.previousScale = data.scale || 1,
                        scale = data.scale = event.scale,
                        startPoint = data.startPoint,
                        currentPoint = data.currentPoint || startPoint,
                        startDistance = data.startDistance,
                        currentDistance = scale * startDistance;

                    if(currentDistance > data.settings.pxThresh){
                        $target.trigger('touchy-pinch', ['move', $target, {
                            "scale": scale,
                            "previousScale": previousScale,
                            "currentPoint": currentPoint,
                            "startPoint": startPoint,
                            "startDistance": startDistance,
                            "originalEvent":  event,
                            "originalTarget": event.target
                        }]);
                    }
                    break;

                //////////////// ROTATE ////////////////
                case 'rotate':
                    data = $target.data('touchyRotate');
                    var lastDegrees = data.lastDegrees = data.degrees,
                        degrees = data.degrees = event.rotation,
                        degreeDelta = lastDegrees ? degrees - lastDegrees : 0,
                        ms = data.moveDate - data.lastMoveDate,
                        velocity = data.velocity = ms === 0 ? 0 : degreeDelta / ms;
                    $target.trigger('touchy-rotate', ['move', $target, {
                        "startPoint": data.startPoint,
                        "startDate": data.startDate,
                        "movePoint": data.movePoint,
                        "lastMovePoint": data.lastMovePoint,
                        "centerCoords": data.centerCoords,
                        "degrees": degrees,
                        "degreeDelta": degreeDelta,
                        "velocity": velocity,
                        "originalEvent":  event,
                        "originalTarget": event.target
                    }]);
                    break;
            }
        },

        handleTouchEnd: function (e) {
            var eventType = this.context,
                $target = this.target,
                event = e.originalEvent,
                data;
            event.preventDefault();

            switch (eventType) {

                //////////////// DRAG ////////////////
                case 'drag':
                    data = $target.data('touchyDrag');
                    if (data.held) {
                        // note: not updating data for end phase
                        var movePoint = data.movePoint || data.startPoint,
                            lastMovePoint = data.lastMovePoint || data.startPoint,
                            distance = movePoint.x === lastMovePoint.x && movePoint.y === lastMovePoint.y ? 0 : Math.sqrt( Math.pow( (movePoint.x - lastMovePoint.x), 2 ) + Math.pow( (movePoint.y - lastMovePoint.y), 2 ) ),
                            ms = data.moveDate - data.lastMoveDate,
                            velocity = ms === 0 ? 0 : distance / ms;
                        $target.trigger('touchy-drag', ['end', $target, {
                            "movePoint":      movePoint,
                            "lastMovePoint":  lastMovePoint,
                            "startPoint":     data.startPoint,
                            "velocity":       velocity,
                            "originalEvent":  event,
                            "originalTarget": event.target
                        }]);
                    }
                    $.extend(data, {
                        "startPoint": null,
                        "startDate": null,
                        "movePoint": null,
                        "moveDate": null,
                        "lastMovePoint": null,
                        "lastMoveDate": null,
                        "originalEvent":  null,
                        "originalTarget": null,
                        "held": false
                    });
                    break;

                //////////////// SWIPE ////////////////
                case 'swipe':
                    data = $target.data('touchySwipe');
                    // note: not updating data for end phase
                    if (data.swiped && data.settings.triggerOn === 'touchend') {
                        triggerSwipe(data, $target);
                    }
                    $.extend(data, {
                        "startPoint": null,
                        "startDate": null,
                        "movePoint": null,
                        "moveDate": null,
                        "lastMovePoint": null,
                        "lastMoveDate": null,
                        "originalEvent":  null,
                        "originalTarget": null,
                        "swiped": false,
                        "swipeExecuted": false
                    });
                    break;

                //////////////// PINCH ////////////////
                case 'pinch':
                    data = $target.data('touchyPinch');

                    var points = getTwoTouchPointData(e);
                    if(points){
                        data.currentPoint = {
                            "x": points.centerX,
                            "y": points.centerY
                        };
                        if (!hasGestureChange()) {
                            var moveDistance = Math.sqrt( Math.pow( (points.x2 - points.x1), 2 ) + Math.pow( (points.y2 - points.y1), 2 ) ),
                                previousScale = data.previousScale = data.scale || 1,
                                startDistance = data.startDistance,
                                scale = data.scale = moveDistance / startDistance,
                                currentDistance = scale * startDistance;
                            if(currentDistance > data.settings.pxThresh){
                                $target.trigger('touchy-pinch', ['end', $target, {
                                    "scale":         scale,
                                    "previousScale": previousScale,
                                    "currentPoint":  data.currentPoint,
                                    "startPoint":    data.startPoint,
                                    "startDistance": startDistance,
                                    "originalEvent":  event,
                                    "originalTarget": event.target
                                }]);
                            }
                        }
                    }
                    $.extend(data, {
                        "startPoint": null,
                        "startDistance": 0,
                        "currentPoint": null,
                        "originalEvent":  null,
                        "originalTarget": null,
                        "pinched": false,
                        "scale": 1,
                        "previousScale": null
                    });
                    break;

                //////////////// LONGPRESS ////////////////
                case 'longpress':
                    data = $target.data('touchyLongpress');
                    clearTimeout(data.timer);
                    $.extend(data, {
                        "startDate":null
                    });
                    break;

                //////////////// ROTATE ////////////////
                case 'rotate':
                    data = $target.data('touchyRotate');
                    var degreeDelta = data.lastDegrees ? data.degrees - data.lastDegrees : 0;
                    $target.trigger('touchy-rotate', ['end', $target, {
                        "startPoint": data.startPoint,
                        "startDate": data.startDate,
                        "movePoint": data.movePoint,
                        "lastMovePoint": data.lastMovePoint,
                        "degrees": data.degrees,
                        "degreeDelta": degreeDelta,
                        "velocity": data.velocity,
                        "originalEvent":  event,
                        "originalTarget": event.target
                    }]);
                    $.extend(data, {
                        "startPoint":null,
                        "startDate":null,
                        "movePoint":null,
                        "moveDate":null,
                        "lastMovePoint":null,
                        "lastMoveDate":null,
                        "targetPageCoords":null,
                        "centerCoords":null,
                        "degrees":null,
                        "lastDegrees":null,
                        "velocity":null,
                        "originalEvent": null,
                        "originalTarget": null
                    });
                    break;
            }
        }

        /*
         * To be implemented
         *
        handleTouchCancel: function (e) {
            var eventType = this.context,
                $target = this.target,
                event = e.originalEvent,
                touches = event.touches;
            event.preventDefault();

            switch (eventType) {

                //////////////// DRAG ////////////////
                case 'drag':
                    console.log('drag touchcancel');
                    break;

                //////////////// SWIPE ////////////////
                case 'swipe':
                    console.log('swipe touchcancel');
                    break;
            }
        }
        */

    },


    // event-specific methods

    updateDragData = function (data, touches, timeStamp) {
        ensureSingularStartData(data, touches, timeStamp);
        var lastMoveDate = data.moveDate || data.startDate,
            moveDate = timeStamp;
        if ( data.held || (moveDate - lastMoveDate) > data.settings.msHoldThresh ){
            $.extend(data, {
                held: true,
                lastMoveDate: lastMoveDate,
                lastMovePoint: data.movePoint && data.movePoint.x ? data.movePoint : data.startPoint,
                moveDate: moveDate,
                movePoint: {
                    "x": touches[0].pageX,
                    "y": touches[0].pageY
                }
            });
        }
        else {
            $.extend(data, {
                held: false,
                lastMoveDate: 0,
                lastMovePoint: data.startPoint,
                moveDate: 0,
                movePoint: data.startPoint
            });
        }
    },

    updateSwipeData = function (data, touches, timeStamp) {
        ensureSingularStartData(data, touches, timeStamp);
        var startDate = data.startDate,
            startPoint = data.startPoint,
            lastMoveDate = data.moveDate || data.startDate,
            moveDate = timeStamp,
            movePoint = {
                "x": touches[0].pageX,
                "y": touches[0].pageY
            },
            hDistance = movePoint.x - startPoint.x, // positive is right
            vDistance = movePoint.y - startPoint.y,  // positive is down
            ms = moveDate - lastMoveDate;
        $.extend(data, {
            lastMoveDate: lastMoveDate,
            lastMovePoint: data.movePoint && data.movePoint.x ? data.movePoint : data.startPoint,
            moveDate: moveDate,
            movePoint: movePoint,
            hDistance: hDistance,
            vDistance: vDistance
        });

        if (!data.swiped && ( Math.abs(hDistance) / ms > data.settings.velocityThresh || Math.abs(vDistance) / ms > data.settings.velocityThresh )) {
            data.swiped = true;
        }
    },

    triggerSwipe = function (data, $target) {
        var movePoint = data.movePoint,
            lastMovePoint = data.lastMovePoint,
            distance = movePoint.x === lastMovePoint.x && movePoint.y === lastMovePoint.y ? 0 : Math.sqrt( Math.pow( (movePoint.x - lastMovePoint.x), 2 ) + Math.pow( (movePoint.y - lastMovePoint.y), 2 ) ),
            ms = data.moveDate - data.lastMoveDate,
            velocity = ms === 0 ? 0 : distance / ms,
            hDistance = data.hDistance,
            vDistance = data.vDistance,
            direction;
        if (velocity > data.settings.velocityThresh) {
            if (Math.abs(hDistance) > Math.abs(vDistance)) {
                direction = hDistance > 0 ? 'right' : 'left';
            }
            else {
                direction = vDistance > 0 ? 'down' : 'up';
            }
            $target.trigger('touchy-swipe', [$target, {
                "direction":     direction,
                "movePoint":     movePoint,
                "lastMovePoint": lastMovePoint,
                "startPoint":    data.startPoint,
                "velocity":      velocity
            }]);
        }
    },


    // other private methods

    ensureSingularStartData = function (data, touches, timeStamp) {
        if (!data.startPoint) {
            data.startPoint = {
                "x": touches[0].pageX,
                "y": touches[0].pageY
            }
        }
        if (!data.startDate) {
            data.startDate = timeStamp;
        }
    },

    hasGestureChange = function () {
        return (typeof window.ongesturechange == "object");
    },

    getTwoTouchPointData = function(e){ // could become multitouch point data for any number of touches?
        var points = false,
            touches = e.originalEvent.touches;
        if(touches.length === 2){
            points = {
                x1: touches[0].pageX,
                y1: touches[0].pageY,
                x2: touches[1].pageX,
                y2: touches[1].pageY
            }
            points.centerX = (points.x1 + points.x2) / 2;
            points.centerY = (points.y1 + points.y2) / 2;
            return points;
        }
        return points;
    },

    // get pageX and pageY of an element
    // from: http://ecmanaut.blogspot.com/2010/06/elementpagex-and-elementpagey.html
    getViewOffset = function (node, singleFrame) {

        function addOffset(node, coords, view) {
            var p = node.offsetParent;
            coords.x += node.offsetLeft - (p ? p.scrollLeft : 0);
            coords.y += node.offsetTop - (p ? p.scrollTop : 0);

            if (p) {
                if (p.nodeType == 1) {
                    var parentStyle = view.getComputedStyle(p, '');
                    if (parentStyle.position != 'static') {
                        coords.x += parseInt(parentStyle.borderLeftWidth);
                        coords.y += parseInt(parentStyle.borderTopWidth);

                        if (p.localName == 'TABLE') {
                            coords.x += parseInt(parentStyle.paddingLeft);
                            coords.y += parseInt(parentStyle.paddingTop);
                        }
                        else if (p.localName == 'BODY') {
                            var style = view.getComputedStyle(node, '');
                            coords.x += parseInt(style.marginLeft);
                            coords.y += parseInt(style.marginTop);
                        }
                    }
                    else if (p.localName == 'BODY') {
                        coords.x += parseInt(parentStyle.borderLeftWidth);
                        coords.y += parseInt(parentStyle.borderTopWidth);
                    }

                    var parent = node.parentNode;
                    while (p != parent) {
                        coords.x -= parent.scrollLeft;
                        coords.y -= parent.scrollTop;
                        parent = parent.parentNode;
                    }
                    addOffset(p, coords, view);
                }
            }
            else {
                if (node.localName == 'BODY') {
                    var style = view.getComputedStyle(node, '');
                    coords.x += parseInt(style.borderLeftWidth);
                    coords.y += parseInt(style.borderTopWidth);

                    var htmlStyle = view.getComputedStyle(node.parentNode, '');
                    coords.x -= parseInt(htmlStyle.paddingLeft);
                    coords.y -= parseInt(htmlStyle.paddingTop);
                }

                if (node.scrollLeft)
                    coords.x += node.scrollLeft;
                if (node.scrollTop)
                    coords.y += node.scrollTop;

                var win = node.ownerDocument.defaultView;
                if (win && (!singleFrame && win.frameElement))
                    addOffset(win.frameElement, coords, win);
            }
        }

        var coords = {
            x: 0,
            y: 0
        };
        if (node)
            addOffset(node, coords, node.ownerDocument.defaultView);

        return coords;
    },

    boundElems = {},
    contexts = {};

    $.each($.touchyOptions, function(key, value){
        var capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);

        boundElems[key] = $([]);
        contexts[key] = new (function () {this.context = key;})();

        $.event.special["touchy-" + key] = {
            setup: function (data, namespaces, eventHandle) {
                boundElems[key] = boundElems[key].add( this );
                $(this).data('touchy' + capitalizedKey, $.extend({}, $.touchyOptions[key].data));
                $(this).data('touchy' + capitalizedKey).settings = $.extend({}, $.touchyOptions[key]);
                delete $(this).data('touchy' + capitalizedKey).settings.data;
                var handler = $(this);
                var context = $.extend({target: handler}, contexts[key]);
                $.each($.touchyOptions[key].proxyEvents, function(i, proxyEvent){
                    handler.bind(proxyEvent.toLowerCase() + '.touchy.' + key, $.proxy(proxyHandlers['handle' + proxyEvent], context));
                });
            },
            teardown: function (namespaces) {
                boundElems[key] = boundElems[key].not( this );
                $(this).removeData('touchy' + capitalizedKey);
                var handler = $(this);
                $.each($.touchyOptions[key].proxyEvents, function(i, proxyEvent){
                    handler.unbind(proxyEvent.toLowerCase() + '.touchy.' + key);
                });
            },
            add: function (handleObj) {
                $.extend($(this).data('touchy' + capitalizedKey).settings, handleObj.data);
                var old_handler = handleObj.handler;
                handleObj.handler = function (event) {
                    return old_handler.apply(this, arguments);
                };
            }
        };
    });

})(jQuery);
