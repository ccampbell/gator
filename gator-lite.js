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
 * Compatible with IE 9+, FF 3.6+, Safari 5+, Chrome
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
    var _matcher,
        _level = 0,
        _handlers = {},
        _gator_instances = {},
        _element_list = [];

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
            return function() {};
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
        if (selector == '_root') {
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
            _level++;
            return _matches(element.parentNode, selector, bound_element);
        }
    }

    /**
     * finds index of element in array
     *
     * @param {Node} element
     * @returns {number}
     */
    function _keyForElement(element) {
        var index = _element_list.indexOf(element);

        if (index < 0) {
            return _element_list.push(element) - 1;
        }

        return index;
    }

    function _addHandler(element, event, selector, callback) {
        selector = selector || '_root';

        var element_id = _keyForElement(element);

        if (!_handlers[element_id]) {
            _handlers[element_id] = {};
        }

        if (!_handlers[element_id][event]) {
            _handlers[element_id][event] = {};
        }

        if (!_handlers[element_id][event][selector]) {
            _handlers[element_id][event][selector] = [];
        }

        _handlers[element_id][event][selector].push(callback);
    }

    function _removeHandler(element, event, selector, callback) {
        var element_id = _keyForElement(element),
            i;

        if (!callback && !selector) {
            delete _handlers[element_id][event];
            return;
        }

        if (!callback) {
            delete _handlers[element_id][event][selector];
            return;
        }

        for (i = 0; i < _handlers[element_id][event][selector].length; i++) {
            if (_handlers[element_id][event][selector][i] === callback) {
                _handlers[element_id][event][selector].pop(i, 1);
                break;
            }
        }
    }

    function _handleEvent(key, e) {
        var type = e.type,
            selector,
            match,
            matches = {},
            max = 0,
            i = 0,
            j = 0;

        if (!_handlers[key][type]) {
            return;
        }

        // find all events that match
        for (selector in _handlers[key][type]) {
            if (_handlers[key][type].hasOwnProperty(selector)) {
                _level = 0;
                match = _matches(e.target, selector, _element_list[key]);
                if (match) {
                    max = Math.max(max, _level);
                    _handlers[key][type][selector].match = match;
                    matches[_level] = _handlers[key][type][selector];
                }
            }
        }

        // if (_handlers[key][type]['_root']) {
        //     max++;
        //     _handlers[key][type]['_root'].match = _element_list[key];
        //     matches[max] = _handlers[key][type]['_root'];
        // }

        // stopPropagation() fails to set cancelBubble to true in Webkit
        e.stopPropagation = function() {
            e.cancelBubble = true;
        };

        for (i = 0; i <= max; i++) {
            if (matches[i]) {
                for (j = 0; j < matches[i].length; j++) {
                    if (matches[i][j].call(matches[i].match, e) === false) {
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                    }

                    if (e.cancelBubble) {
                        return;
                    }
                }
            }
        }
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

        var key = _keyForElement(this.element),
            global_callback = function(e) {
                _handleEvent(key, e);
            },
            i;

        for (i = 0; i < events.length; i++) {

            if (!_handlers[key] && !remove) {

                // blur and focus do not bubble up but if you use event capturing
                // then you will get them
                var use_capture = events[i] == 'blur' || events[i] == 'focus';
                this.element[remove ? 'removeEventListener' : 'addEventListener'](events[i], global_callback, use_capture);
            }

            if (remove) {
                _removeHandler(this.element, events[i], selector, callback);
                continue;
            }

            _addHandler(this.element, events[i], selector, callback);
        }

        return this;
    }

    /**
     * Gator object constructor
     *
     * @param {Node} element
     */
    function Gator(element) {

        // called as function
        if (!(this instanceof Gator)) {
            var key = _keyForElement(element);

            // only keep one Gator instance per node to make sure that
            // we don't create a ton of new objects if you want to delegate
            // multiple events from the same node
            //
            // for example: Gator(document).on(...
            if (!_gator_instances[key]) {
                _gator_instances[key] = new Gator(element);
            }

            return _gator_instances[key];
        }

        this.element = element;
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

    // Gator.on = function(events, selector, callback) {
    //     return Gator(document).on(events, selector, callback);
    // };

    // Gator.off = function(events, selector, callback) {
    //     return Gator(document).off(events, selector, callback);
    // };


    window.Gator = Gator;
}) ();
