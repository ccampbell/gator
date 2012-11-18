/*
 * Copyright 2012 Craig Campbell
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * GATOR.JS
 * Simple Event Delegation
 *
 *             .-._   _ _ _ _ _ _ _ _
 *  .-''-.__.-'00  '-' ' ' ' ' ' ' ' '-.
 * '.___ '    .   .--_'-' '-' '-' _'-' '._
 *  V: V 'vv-'   '_   '.       .'  _..' '.'.
 *    '=.____.=_.--'   :_.__.__:_   '.   : :
 *            (((____.-'        '-.  /   : :
 *                              (((-'\ .' /
 *                            _____..'  .'
 *                           '-._____.-'
 */
(function() {
    var Gator = function(element) {
            this.element = element;
        },
        _matcher,
        _handlers = {},
        _instances = {},
        _element_list = [];

    /**
     * cross browser add or event method
     *
     * @param {boolean} remove
     * @param {Node|HTMLDocument} element
     * @param {string} type
     * @param {Function} callback
     * @returns void
     */
    function _event(remove, element, type, callback) {
        if (element.addEventListener) {

            // blur and focus do not bubble up but if you use event capturing
            // then you will get them
            element[remove ? 'removeEventListener' : 'addEventListener'](type, callback, type == 'blur' || type == 'focus');
            return;
        }

        // internet explorer does not support event capturing
        // but does have fallback events to use that will bubble
        if (type == 'focus') {
            type = 'focusin';
        }

        if (type == 'blur') {
            type = 'focusout';
        }

        element[remove ? 'detachEvent' : 'attachEvent']('on' + type, callback);
    }

    /**
     * stops propagation and prevents default behavior
     * of this event
     *
     * @returns void
     */
    function _cancel(e) {
       if (e.preventDefault) {
            e.preventDefault();
        }

        if (e.stopPropagation) {
            e.stopPropagation();
        }

        e.returnValue = false;
        e.cancelBubble = true;
    }

    /**
     * for simple selector matching of ids, class names, or tag names
     *
     * @param {string} selector
     * @returns {boolean}
     */
    function _matchesSelector(selector) {

        // check for class name
        if (selector.charAt(0) === '.') {
            return (' ' + this.className + ' ').indexOf(' ' + selector.slice(1) + ' ') > -1;
        }

        // check for id
        if (selector.charAt(0) === '#') {
            return this.id === selector.slice(1);
        }

        // check for tag
        return this.tagName === selector.toUpperCase();
    }

    /**
     * returns function to use for determining if an element
     * matches a query selector
     *
     * @returns {Function}
     */
    function _getMatcher(element) {
        if (_matcher) {
            return _matcher;
        }

        if (element.matches) {
            _matcher = element.matches;
        }

        if (element.webkitMatchesSelector) {
            _matcher = element.webkitMatchesSelector;
        }

        if (element.mozMatchesSelector) {
            _matcher = element.mozMatchesSelector;
        }

        if (element.msMatchesSelector) {
            _matcher = element.msMatchesSelector;
        }

        // if it doesn't match a native browser method
        // fall back to the gator function
        if (!_matcher) {
            _matcher = _matchesSelector;
        }

        return _matcher;
    }

    /**
     * determines if the specified element matches a given selector
     *
     * @param {Node} element - the element to compare against the selector
     * @param {string} selector
     * @param {Node} bound_element - the element the listener was attached to
     * @returns {void|Node}
     */
    function _matches(element, selector, bound_element) {

        // no selector means this event was bound directly to this element
        if (!selector) {
            return element;
        }

        // if we have moved up to the element you bound the event to
        // then we have come too far
        if (element === bound_element) {
            return;
        }

        // if this is a match then we are done!
        if (_getMatcher(element).call(element, selector)) {
            return element;
        }

        // if this element did not match but has a parent we should try
        // going up the tree to see if any of the parent elements match
        // for example if you are looking for a click on an <a> tag but there
        // is a <span> inside of the a tag that it is the target,
        // it should still work
        if (element.parentNode) {
            return _matches(element.parentNode, selector, bound_element);
        }
    }

    function _keyForElement(element) {
        var i = _element_list.length,
            index = false;

        while (i--) {
            if (_element_list[i] === element) {
                index = i;
                break;
            }
        }

        if (index === false) {
            return _element_list.push(element) - 1;
        }

        return index;
    }

    /**
     * gets the event handler for a specific binding
     *
     * @param {Function} callback
     * @param {Node|HTMLDocument} element
     * @param {string} event
     * @param {string} selector
     * @returns {Function}
     */
    function _handlerForCallback(callback, element, event, selector) {

        var key = _keyForElement(element) + event + selector;

        if (_handlers[key]) {
            return _handlers[key];
        }

        _handlers[key] = function(e) {
            var match = _matches(e.target || e.srcElement, selector, element);
            if (match) {
                if (callback.call(match, e) === false) {
                    _cancel(e);
                }
            }
        };

        return _handlers[key];
    }

    /**
     * binds the specified events to the element
     *
     * @param {string|Array} events
     * @param {string} selector
     * @param {Function} callback
     * @param {boolean=} off
     * @returns {Object}
     */
    function _bind(events, selector, callback, remove) {
        if (!(events instanceof Array)) {
            events = [events];
        }

        if (!remove && !callback) {
            callback = selector;
            selector = null;
        }

        for (var i = 0; i < events.length; i++) {
            _event(remove, this.element, events[i], _handlerForCallback(callback, this.element, events[i], selector));
        }

        return this;
    }

    /**
     * adds an event
     *
     * @param {string|Array} events
     * @param {string} selector
     * @param {Function} callback
     * @returns {Object}
     */
    Gator.prototype.on = function(events, selector, callback) {
        return _bind.call(this, events, selector, callback);
    };

    /**
     * removes an event
     *
     * @param {string|Array} events
     * @param {string} selector
     * @returns {Object}
     */
    Gator.prototype.off = function(events, selector, callback) {
        return _bind.call(this, events, selector, callback, true);
    };

    window.Gator = function(element) {
        var key = _keyForElement(element);

        if (!_instances[key]) {
            _instances[key] = new Gator(element);
        }

        return _instances[key];
    };
}) ();
