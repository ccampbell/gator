/**
 * this plugin adds support for IE < 9, Safari < 5, and Firefox < 3.6
 *
 * note that when using legacy browsers you can only delegate to
 * 1. a single class name
 * 2. a single id
 * 3. a single tag name
 *
 * for example
 * Gator(ul).on('click', '.test', _doSomething); will work but
 * Gator(ul).on('click', 'li.test', _doSomething); will not
 */
Gator.addEvent = function(gator, type, callback, handlers) {
    if (!handlers[gator.id]) {
        if (gator.element.addEventListener) {

            // blur and focus do not bubble up but if you use event capturing
            // then you will get them
            var use_capture = type == 'blur' || type == 'focus';
            gator.element.addEventListener(type, callback, use_capture);
            return type;
        }

        // internet explorer does not support event capturing
        // but does have fallback events to use that will bubble
        if (type == 'focus') {
            type = 'focusin';
        }

        if (type == 'blur') {
            type = 'focusout';
        }

        gator.element.attachEvent('on' + type, callback);
    }

    return type;
};

Gator.matchesSelector = function(selector) {

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
};

Gator.cancel = function(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }

    if (e.stopPropagation) {
        e.stopPropagation();
    }

    // for IE
    e.returnValue = false;
    e.cancelBubble = true;
};
