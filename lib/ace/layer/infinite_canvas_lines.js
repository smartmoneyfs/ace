/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

define(function(require, exports, module) {
"use strict";

var dom = require("../lib/dom");

var InfiniteCanvasLines = function(element) {
    this.element = element;
    this.cells = [];
    this.cellCache = [];
};

(function() {
    
    this.getLength = function() {
        return this.cells.length;
    };
    
    this.shift = function() {
        this.$cacheCell(this.cells.shift());
    };
    
    this.pop = function() {
        this.$cacheCell(this.cells.pop());
    };
    
    this.push = function(cell) {
        if (cell.length) {
            this.cells.push.apply(this.cells, cell);
            var fragment = dom.createFragment(this.element);
            for (var i=0; i<cell.length; i++) {
                fragment.appendChild(cell[i].element);
            }
            this.element.appendChild(fragment);
         } else {
            this.cells.push(cell);
            this.element.appendChild(cell.element);
         }
    };
    
    this.unshift = function(cell) {
        if (cell.length) {
            this.cells.unshift.apply(this.cells, cell);
            var fragment = dom.createFragment(this.element);
            for (var i=0; i<cell.length; i++) {
                fragment.appendChild(cell[i].element);
            }
            if (this.element.firstChild)
                this.element.insertBefore(fragment, this.element.firstChild);
            else
                this.element.appendChild(fragment);
         } else {
            this.cells.unshift(cell);
            this.element.insertAdjacentElement("afterbegin", cell.element);
         }
    };
    
    this.last = function() {
        if (this.cells.length)
            return this.cells[this.cells.length-1];
        else
            return this.createCell();
    };
    
    this.$cacheCell = function(cell) {
        if (!cell)
            return;
            
        cell.element.remove();
        this.cellCache.push(cell);
    };
    
    this.createCell = function() {
        var cell = this.cellCache.pop();
        if (!cell) {
            var element = dom.createElement("div");
    
            var textNode = document.createTextNode('');
            element.appendChild(textNode);
            
            var foldWidget = dom.createElement("span");
            element.appendChild(foldWidget);
            this.element.appendChild(element);
            
            cell = {
                element: element,
                height: 0,
                text: ""
            };
        }
        return cell;
    };
    
    this.updatePositions = function() {
    };
    
}).call(InfiniteCanvasLines.prototype);

exports.InfiniteCanvasLines = InfiniteCanvasLines;

});
