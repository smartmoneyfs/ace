"use strict";

// var jsdom = require('jsdom/').jsdom;
// var doc = jsdom("<html><head></head><body></body></html>");
var CHAR_HEIGHT = 10;
var CHAR_WIDTH = 6;

function Node(name) {
    this.localName = name;
    this.value = "";
    this.tagName = name && name.toUpperCase();
    this.children = [];
    this.ownerDocument = global.document || this;
    this.$attributes = {};
    this.style = { opacity: "" };
}
Node.prototype.appendChild = function(node) {
    this.children.push(node);
    node.parentNode = this;
    return node;
};
Node.prototype.removeChild = function(node) {
    var i = this.children.indexOf(node);
    if (i == -1)
        throw new Error("not a child");
    node.parentNode = null;
    this.children.splice(i, 1);
    if (!document.contains(document.activeElement))
        document.activeElement = document.body;
};
Node.prototype.replaceChild = function(node, oldNode) {
    var i = this.children.indexOf(oldNode);
    if (i == -1)
        return this.appendChild(node);
    this.children.splice(i, 1, node);
    node.parentNode = this;
    oldNode.parentNode = null;
    if (!document.contains(document.activeElement))
        document.activeElement = document.body;
    return oldNode;
};
Node.prototype.insertBefore = function(node, before) {
    var i = this.children.indexOf(before);
    if (i == -1)
        return this.appendChild(node);
    this.children.splice(i - 1, 0, node);
    node.parentNode = this;
    return node;
};
Node.prototype.querySelectorAll = function(s) {
    var nodes = [];
    walk(this, function(node) {
        if (node.localName == s)
            nodes.push(node);
    });
    return nodes;
};
Node.prototype.getElementsByTagName = function(s) {
    var nodes = [];
    walk(this, function(node) {
        if (node.localName == s)
            nodes.push(node);
    });
    return nodes;
};
Node.prototype.getElementById = function(s) {
    return walk(this, function(node) {
        // console.log(node.getAttribute && node.getAttribute("id"))
        if (node.getAttribute && node.getAttribute("id") == s)
            return node;
    });
};
Node.prototype.setAttribute = function(a, v) {
    this.$attributes[a] = v;
};
Node.prototype.getAttribute = function(a, v) {
    return String(this.$attributes[a]);
};
Node.prototype.__defineGetter__("textContent", function() {
    var v = "";
    walk(this, function(node) {
        if (node instanceof TextNode)
            v += node.data;
    });
    return v;
});
Node.prototype.__defineSetter__("textContent", function(v) {
    this.children.length = 0;
    this.appendChild(new TextNode(v));
});
Node.prototype.__defineGetter__("id", function() {
    return this.getAttribute("id");
});
Node.prototype.__defineSetter__("id", function(v) {
    this.setAttribute("id", v);
});
Node.prototype.__defineGetter__("parentElement", function() {
    return this.parentNode == document ? null : this.parentNode;
});
Node.prototype.__defineGetter__("innerHTML", function() {
    return "";
});
Node.prototype.__defineSetter__("innerHTML", function(v) {
    var root = this;
    var tagRe = /<(\/?\w+)|&(?:(#?\w+);)|$/g;
    var skipped = "";

    for (var m, lastIndex = 0; m = tagRe.exec(v);) { 
        skipped += v.substring(lastIndex, m.index);
        if (m[2]) {
            if (m[2] == "gt") {
                skipped += ">";
            } else if (m[2] == "lt") {
                skipped += "<";
            } else if (m[2] == "amp") {
                skipped += "&";
            }
            lastIndex = tagRe.lastIndex ;
        } else {
            if (skipped) {
                root.appendChild(document.createTextNode(skipped));
                skipped = "";
            }
            var end = v.indexOf(">", tagRe.lastIndex);
            tagRe.lastIndex = lastIndex = end < 0 ? v.length : end + 1;
            
            if (!m[1]) {
                return;
            }
            if (m[1][0] == "/") {
                if (root != this)
                    root = root.parentNode;
            } else {
                var tagName = m[1];
                root = root.appendChild(document.createElement(tagName));
            }
        }
    }
});
Node.prototype.getBoundingClientRect = function(v) {
    var w = 0;
    var h = 0;
    if (this.style.width == "auto") {
        w = this.textContent.length * CHAR_WIDTH;
        h = CHAR_HEIGHT;
    }
    return {top: 0, left: 0, width: w, height: h};
};

Node.prototype.__defineGetter__("clientHeight", function() {
    return this.getBoundingClientRect().height;
});
Node.prototype.__defineGetter__("clientWidth", function() {
    return this.getBoundingClientRect().width;
});


Node.prototype.addEventListener = function(name, listener, capturing) {
    if (!this._events) this._events = {};
    if (!this._events[name]) this._events[name] = [];
    var i = this._events[name].indexOf(listener);
    if (i == -1)
        this._events[name][capturing ? "unshift" : "push"](listener);
};
Node.prototype.removeEventListener = function(name, listener) {
    if (!this._events) return;
    if (!this._events[name]) return;
    var i = this._events[name].indexOf(this._events[name]);
    if (i !== -1)
        this._events[name].splice(i, 1);
};
Node.prototype.createEvent = function(v) {
    return {
        initMouseEvent: function(type, _1, _2, window,
            detail, x, y, _x, _y,
            ctrl, alt, shift, meta,
            button, relatedTarget
        ) {
            this.type = type;
            this.detail = detail;
            this.clientX = x;
            this.clientY = y;
            this.button = button;
            this.relatedTarget = relatedTarget;
            this.ctrlKey = ctrl;
            this.altKey = alt;
            this.shiftKey = shift;
            this.metaKey = meta;
            this.preventDefault = function() {};
            this.stopPropagation = function() {
                this.stopped = true;
            };
        }
    };
};
Node.prototype.dispatchEvent = function(e) {
    if (!e.target) e.target = this;
    e.currentTarget = this;
    var events = this._events && this._events[e.type];
    events && events.forEach(function(listener) {
        if (!e.stopped)
            listener.call(this, e);
    }, this);
    if (this.parentNode)
        this.parentNode.dispatchEvent(e);
    else if (this != window)
        window.dispatchEvent(e);
};
Node.prototype.contains = function(node) {
    return node == this || walk(this, function(child) {
        return child == node;
    });
};
Node.prototype.focus = function() {
    if (document.activeElement == this)
        return;
    if (document.activeElement)
        document.activeElement.dispatchEvent({type: "blur"});
    document.activeElement = this;
    this.dispatchEvent({type: "focus"});
};
function walk(node, fn) {
    var ch = node.children || [];
    for (var i = 0; i < ch.length; i++) {
        var result = fn(ch[i]) || walk(ch[i], fn);
        if (result)
            return result;
    }
}

function TextNode(value) {
    this.data = value || "";
}
var document = new Node();

document.navigator = {};
document.createElement = function(t) {
    return new Node(t);
};
document.createTextNode = function(v) {
    return new TextNode(v);
};
document.hasFocus = function() {
    return true;
};
document.documentElement = document.appendChild(new Node("html"));
document.body = new Node("body");
document.head = new Node("head");
document.documentElement.appendChild(document.head);
document.documentElement.appendChild(document.body);

var window = {};
window.document = document;
window.document.defaultView = window;

window.setTimeout = setTimeout;
window.clearTimeout = clearTimeout;
window.getComputedStyle = function(node) {
    return node.style;
};
window.addEventListener = Node.prototype.addEventListener;
window.removeEventListener = Node.prototype.removeEventListener;
window.dispatchEvent = Node.prototype.dispatchEvent;
window.name = "nodejs";
window.focus = function() {};



global.window = window;
global.document = document;