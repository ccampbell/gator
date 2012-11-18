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
 * Lite Version
 * Compatible with IE9+, FF 3.6+, Safari 5+, Chrome
 *
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
        matcher,
        handlers = {},
        instances = {},
        element_list = [];

    /**
     * returns function to use for determining if an element
     * matches a query selector
     *
     * @returns {Function}
     */
    function _getMatcher(element) {
        if (matcher) {
            return matcher;
        }

        if (element.matches) {
            matcher = element.matches;
        }

        if (element.webkitMatchesSelector) {
            matcher = element.webkitMatchesSelector;
        }

        if (element.mozMatchesSelector) {
            matcher = element.mozMatchesSelector;
        }

        if (element.msMatchesSelector) {
            matcher = element.msMatchesSelector;
        }

        if (!matcher) {
            matcher = function() {};
        }

        return matcher;
    }

    /**
     * determines if the specified element matches a given selector
     *
     * @param {Node} element - the element to compare against the selector
     * @param {string} selector
     * @param {Node} bound_element - the element the listener was attached to
     * @returns {null|Node}
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
        var index = element_list.indexOf(element);

        if (index < 0) {
            return element_list.push(element) - 1;
        }

        return index;
    }


    /**
     * gets the event handler for a specific binding
     *
     * @param {Function} callback
     * @param {Node|HTMLDocument}
     * @param {string} event
     * @param {string} selector
     * @returns {Function}
     */
    function _handlerForCallback(callback, element, event, selector) {

        key = _keyForElement(element) + event + selector;

        if (handlers[key]) {
            return handlers[key];
        }

        handlers[key] = function(e) {
            var match = _matches(e.target, selector, element);
            if (match) {
                if (callback.call(match, e) === false) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        };

        return handlers[key];
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
    function _bind(events, selector, callback, off) {
        if (!(events instanceof Array)) {
            events = [events];
        }

        if (!callback) {
            callback = selector;
            selector = null;
        }

        var element = this.element;

        events.forEach(function (event) {

            // blur and focus do not bubble up but if you use event capturing
            // then you will get them
            element[off ? 'removeEventListener' : 'addEventListener'](event, _handlerForCallback(callback, element, event, selector), event == 'blur' || event == 'focus');
        });

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

        if (!instances[key]) {
            console.log('creating new gator', element);
            instances[key] = new Gator(element);
        }

        return instances[key];
    };
}) ();
