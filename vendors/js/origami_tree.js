var main_svg_width, main_svg_height, sidewidth;
var thumbnail = 0;
var ox,oy;
var drag_el = null;
var drag_canvas = null;
var sx,sy;
var svg;
var nodes, buttons;
var origamiTree;
var selected_nodes = [];

$.extend({
    URLEncode:function(c) {
        var o='';
        var x=0;
        c=c.toString();
        var r=/(^[a-zA-Z0-9_.]*)/;
        while(x<c.length) {
            var m=r.exec(c.substr(x));
            if(m!=null && m.length>1 && m[1]!='') {
                o+=m[1];
                x+=m[1].length;
            } else {
                if(c[x]==' ')
                    o+='+';
                else {
                    var d=c.charCodeAt(x);
                    var h=d.toString(16);
                    o+='%'+(h.length<2?'0':'')+h.toUpperCase();
                }
                x++;
            }
        }
        return o;
    },
    URLDecode:function(s){
        var o=s.replace(/\+/g, ' ');
        var binVal,t;
        var r=/(%[^%]{2})/;
        while((m=r.exec(o))!=null && m.length>1 && m[1]!='') {
            b=parseInt(m[1].substr(1),16);
            t=String.fromCharCode(b);
            o=o.replace(m[1],t);
        }
        return o;
    }
});

/**
 * BEGIN Origami Tree Code
 */
OrigamiNode = function (id, pid, w, h) {
    this.id = id;
    this.pid = pid;
    this.w = w;
    this.h = h;

    this.siblingIndex = 0;
    this.dbIndex = 0;

    this.XPosition = 0;
    this.YPosition = 0;
    this.prelim = 0;
    this.modifier = 0;
    this.leftNeighbor = null;
    this.rightNeighbor = null;
    this.nodeParent = null;
    this.container = null;
    this.group = null;
    this.nodeChildren = [];
    this.origamiData = []
}

OrigamiNode.prototype._getLevel = function () {
    if (this.nodeParent.id == -1) {return 0;}
    else return this.nodeParent._getLevel() + 1;
}

OrigamiNode.prototype._getChildrenCount = function () {
    if(this.nodeChildren == null) {
        return 0;
    } else {
        return this.nodeChildren.length;
    }
}

OrigamiNode.prototype._getLeftSibling = function () {
    if(this.leftNeighbor != null && this.leftNeighbor.nodeParent == this.nodeParent) {
        return this.leftNeighbor;
    } else {
        return null;
    }
}

OrigamiNode.prototype._getRightSibling = function () {
    if(this.rightNeighbor != null && this.rightNeighbor.nodeParent == this.nodeParent) {
        return this.rightNeighbor;
    } else {
        return null;
    }
}

OrigamiNode.prototype._getChildAt = function (i) { return this.nodeChildren[i]; }

OrigamiNode.prototype._getChildrenCenter = function (tree) {
    node = this._getFirstChild();
    node1 = this._getLastChild();
    return node.prelim + ((node1.prelim - node.prelim) + tree._getNodeSize(node1)) / 2;
}

OrigamiNode.prototype._getFirstChild = function () { return this._getChildAt(0); }

OrigamiNode.prototype._getLastChild = function () { return this._getChildAt(this._getChildrenCount() - 1); }

OrigamiNode.prototype._drawChildrenLinks = function (tree) {
    var s = [];
    var xa = 0, ya = 0, xb = 0, yb = 0, xc = 0, yc = 0, xd = 0, yd = 0;
    var node1 = null;

    switch(tree.config.iRootOrientation) {
        case OrigamiTree.RO_TOP:
            xa = this.XPosition + (this.w / 2);
            ya = this.YPosition + this.h;
            break;

        case OrigamiTree.RO_BOTTOM:
            xa = this.XPosition + (this.w / 2);
            ya = this.YPosition;
            break;

        case OrigamiTree.RO_RIGHT:
            xa = this.XPosition;
            ya = this.YPosition + (this.h / 2);
            break;

        case OrigamiTree.RO_LEFT:
            xa = this.XPosition + this.w;
            ya = this.YPosition + (this.h / 2);
            break;
    }

    for (var k = 0; k < this.nodeChildren.length; k++) {
        node1 = this.nodeChildren[k];

        switch(tree.config.iRootOrientation) {
            case OrigamiTree.RO_TOP:
                xd = xc = node1.XPosition + (node1.w / 2);
                yd = node1.YPosition;
                xb = xa;
                switch (tree.config.iNodeJustification) {
                    case OrigamiTree.NJ_TOP:
                        yb = yc = yd - tree.config.iLevelSeparation / 2;
                        break;
                    case OrigamiTree.NJ_BOTTOM:
                        yb = yc = ya + tree.config.iLevelSeparation / 2;
                        break;
                    case OrigamiTree.NJ_CENTER:
                        yb = yc = ya + (yd - ya) / 2;
                        break;
                }
                break;

            case OrigamiTree.RO_BOTTOM:
                xd = xc = node1.XPosition + (node1.w / 2);
                yd = node1.YPosition + node1.h;
                xb = xa;
                switch (tree.config.iNodeJustification) {
                    case OrigamiTree.NJ_TOP:
                        yb = yc = yd + tree.config.iLevelSeparation / 2;
                        break;
                    case OrigamiTree.NJ_BOTTOM:
                        yb = yc = ya - tree.config.iLevelSeparation / 2;
                        break;
                    case OrigamiTree.NJ_CENTER:
                        yb = yc = yd + (ya - yd) / 2;
                        break;
                }
                break;

            case OrigamiTree.RO_RIGHT:
                xd = node1.XPosition + node1.w;
                yd = yc = node1.YPosition + (node1.h / 2);
                yb = ya;
                switch (tree.config.iNodeJustification) {
                    case OrigamiTree.NJ_TOP:
                        xb = xc = xd + tree.config.iLevelSeparation / 2;
                        break;
                    case OrigamiTree.NJ_BOTTOM:
                        xb = xc = xa - tree.config.iLevelSeparation / 2;
                        break;
                    case OrigamiTree.NJ_CENTER:
                        xb = xc = xd + (xa - xd) / 2;
                        break;
                }
                break;

            case OrigamiTree.RO_LEFT:
                xd = node1.XPosition;
                yd = yc = node1.YPosition + (node1.h / 2);
                yb = ya;
                switch (tree.config.iNodeJustification) {
                    case OrigamiTree.NJ_TOP:
                        xb = xc = xd - tree.config.iLevelSeparation / 2;
                        break;
                    case OrigamiTree.NJ_BOTTOM:
                        xb = xc = xa + tree.config.iLevelSeparation / 2;
                        break;
                    case OrigamiTree.NJ_CENTER:
                        xb = xc = xa + (xd - xa) / 2;
                        break;
                }
                break;
        }

        switch (tree.config.linkType) {
            case "M":
                vl1 = svg.line(this.group, xa, ya, xb, yb, {'class': 'attach_line',stroke: "#CCC","stroke-width": 4, "stroke-opacity": 0.5});
                svg.line(this.group, xb, yb, xc, yc, {'class': 'attach_line',stroke: "#CCC","stroke-width": 4, "stroke-opacity": 0.5});
                vl2 = svg.line(this.group, xc, yc, xd, yd, {'class': 'attach_line',stroke: "#CCC","stroke-width": 4, "stroke-opacity": 0.5});
/*
                vb = svg.use(this.container, xa, ya, 18, 18, '#attach_button_prototype');
                vb.line = vl2;
                vl1.button = vb
*/
                break;

/*
            case "B":
                tree.ctx.moveTo(xa,ya);
                tree.ctx.bezierCurveTo(xb,yb,xc,yc,xd,yd);
                break;
*/
        }
    }
}

OrigamiTree = function () {
    this.config = {
        iMaxDepth : 100,
        iLevelSeparation : 40,
        iSiblingSeparation : 40,
        iSubtreeSeparation : 80,
        iRootOrientation : OrigamiTree.RO_TOP,
        iNodeJustification : OrigamiTree.NJ_CENTER,
        topXAdjustment : 0,
        topYAdjustment : 0,
        linkType : "M",
        defaultNodeWidth : 80,
        defaultNodeHeight : 40,
    }

    this.self = this;

    this.maxLevelHeight = [];
    this.maxLevelWidth = [];
    this.previousLevelNode = [];

    this.rootYOffset = 0;
    this.rootXOffset = 0;
    this.XOffset = 0;
    this.YOffset = 0;
    this.Width = 0;
    this.Height = 0;
    this.searchText = null;
    this.searchButton = null;
    this.nDatabaseNodes = [];
    this.mapIDs = {};

    this.root = new OrigamiNode(-1, null, 400, 150);
}

//Constant values

//Tree orientation
OrigamiTree.RO_TOP = 0;
OrigamiTree.RO_BOTTOM = 1;
OrigamiTree.RO_RIGHT = 2;
OrigamiTree.RO_LEFT = 3;

//Level node alignment
OrigamiTree.NJ_TOP = 0;
OrigamiTree.NJ_CENTER = 1;
OrigamiTree.NJ_BOTTOM = 2;

//Layout algorithm
OrigamiTree._firstWalk = function (tree, node, level) {
    var leftSibling = null;

    node.XPosition = 0;
    node.YPosition = 0;
    node.prelim = 0;
    node.modifier = 0;
    node.leftNeighbor = null;
    node.rightNeighbor = null;
    tree._setLevelHeight(node, level);
    tree._setLevelWidth(node, level);
    tree._setNeighbors(node, level);
    if(node._getChildrenCount() == 0 || level == tree.config.iMaxDepth) {
        leftSibling = node._getLeftSibling();
        if(leftSibling != null) {
            node.prelim = leftSibling.prelim + tree._getNodeSize(leftSibling) + tree.config.iSiblingSeparation;
        } else {
            node.prelim = 0;
        }
    } else {
        var n = node._getChildrenCount();
        for(var i = 0; i < n; i++) {
            var iChild = node._getChildAt(i);
            OrigamiTree._firstWalk(tree, iChild, level + 1);
        }

        var midPoint = node._getChildrenCenter(tree);
        midPoint -= tree._getNodeSize(node) / 2;
        leftSibling = node._getLeftSibling();
        if(leftSibling != null) {
            node.prelim = leftSibling.prelim + tree._getNodeSize(leftSibling) + tree.config.iSiblingSeparation;
            node.modifier = node.prelim - midPoint;
            OrigamiTree._apportion(tree, node, level);
        } else {
            node.prelim = midPoint;
        }
    }
}

OrigamiTree._apportion = function (tree, node, level) {
    var firstChild = node._getFirstChild();
    var firstChildLeftNeighbor = firstChild.leftNeighbor;
    var j = 1;
    for(var k = tree.config.iMaxDepth - level; firstChild != null && firstChildLeftNeighbor != null && j <= k;) {
        var modifierSumRight = 0;
        var modifierSumLeft = 0;
        var rightAncestor = firstChild;
        var leftAncestor = firstChildLeftNeighbor;
        for(var l = 0; l < j; l++) {
            rightAncestor = rightAncestor.nodeParent;
            leftAncestor = leftAncestor.nodeParent;
            modifierSumRight += rightAncestor.modifier;
            modifierSumLeft += leftAncestor.modifier;
        }

        var totalGap = (firstChildLeftNeighbor.prelim + modifierSumLeft + tree._getNodeSize(firstChildLeftNeighbor) + tree.config.iSubtreeSeparation) - (firstChild.prelim + modifierSumRight);
        if(totalGap > 0) {
            var subtreeAux = node;
            var numSubtrees = 0;
            for(; subtreeAux != null && subtreeAux != leftAncestor; subtreeAux = subtreeAux._getLeftSibling()) {
                numSubtrees++;
            }

            if(subtreeAux != null) {
                var subtreeMoveAux = node;
                var singleGap = totalGap / numSubtrees;
                for(; subtreeMoveAux != leftAncestor; subtreeMoveAux = subtreeMoveAux._getLeftSibling()) {
                    subtreeMoveAux.prelim += totalGap;
                    subtreeMoveAux.modifier += totalGap;
                    totalGap -= singleGap;
                }
            }
        }

        j++;
        if(firstChild._getChildrenCount() == 0) {
            firstChild = tree._getLeftmost(node, 0, j);
        } else {
            firstChild = firstChild._getFirstChild();
        }
        if(firstChild != null) {
            firstChildLeftNeighbor = firstChild.leftNeighbor;
        }
    }
}

OrigamiTree._secondWalk = function (tree, node, level, X, Y) {
    if(level <= tree.config.iMaxDepth) {
        var xTmp = tree.rootXOffset + node.prelim + X;
        var yTmp = tree.rootYOffset + Y;
        var maxsizeTmp = 0;
        var nodesizeTmp = 0;
        var flag = false;

        switch(tree.config.iRootOrientation) {
            case OrigamiTree.RO_TOP:
            case OrigamiTree.RO_BOTTOM:
                maxsizeTmp = tree.maxLevelHeight[level];
                nodesizeTmp = node.h;
                break;

            case OrigamiTree.RO_RIGHT:
            case OrigamiTree.RO_LEFT:
                maxsizeTmp = tree.maxLevelWidth[level];
                flag = true;
                nodesizeTmp = node.w;
                break;
        }

        switch(tree.config.iNodeJustification) {
            case OrigamiTree.NJ_TOP:
                node.XPosition = xTmp;
                node.YPosition = yTmp;
                break;

            case OrigamiTree.NJ_CENTER:
                node.XPosition = xTmp;
                node.YPosition = yTmp + (maxsizeTmp - nodesizeTmp) / 2;
                break;

            case OrigamiTree.NJ_BOTTOM:
                node.XPosition = xTmp;
                node.YPosition = (yTmp + maxsizeTmp) - nodesizeTmp;
                break;
        }

        if(flag) {
            var swapTmp = node.XPosition;
            node.XPosition = node.YPosition;
            node.YPosition = swapTmp;
        }

        switch(tree.config.iRootOrientation) {
            case OrigamiTree.RO_BOTTOM:
                node.YPosition = -node.YPosition - nodesizeTmp;
                break;

            case OrigamiTree.RO_RIGHT:
                node.XPosition = -node.XPosition - nodesizeTmp;
                break;
        }

        if(node._getChildrenCount() != 0) {
            OrigamiTree._secondWalk(tree, node._getFirstChild(), level + 1, X + node.modifier, Y + maxsizeTmp + tree.config.iLevelSeparation);
        }

        var rightSibling = node._getRightSibling();
        if(rightSibling != null) {
            OrigamiTree._secondWalk(tree, rightSibling, level, X, Y);
        }
    }
}

OrigamiTree.prototype._positionTree = function () {
    this.maxLevelHeight = [];
    this.maxLevelWidth = [];
    this.previousLevelNode = [];
    OrigamiTree._firstWalk(this.self, this.root, 0);

    switch(this.config.iRootOrientation) {
        case OrigamiTree.RO_TOP:
        case OrigamiTree.RO_LEFT:
            this.rootXOffset = this.config.topXAdjustment + this.root.XPosition;
            this.rootYOffset = this.config.topYAdjustment + this.root.YPosition;
            break;

        case OrigamiTree.RO_BOTTOM:
        case OrigamiTree.RO_RIGHT:
            this.rootXOffset = this.config.topXAdjustment + this.root.XPosition;
            this.rootYOffset = this.config.topYAdjustment + this.root.YPosition;
    }

    OrigamiTree._secondWalk(this.self, this.root, 0, 0, 0);
}

OrigamiTree.prototype._setLevelHeight = function (node, level) {
    if (this.maxLevelHeight[level] == null)
        this.maxLevelHeight[level] = 0;
    if(this.maxLevelHeight[level] < node.h)
        this.maxLevelHeight[level] = node.h;
}

OrigamiTree.prototype._setLevelWidth = function (node, level) {
    if (this.maxLevelWidth[level] == null)
        this.maxLevelWidth[level] = 0;
    if(this.maxLevelWidth[level] < node.w)
        this.maxLevelWidth[level] = node.w;
}

OrigamiTree.prototype._setNeighbors = function(node, level) {
    node.leftNeighbor = this.previousLevelNode[level];
    if(node.leftNeighbor != null)
        node.leftNeighbor.rightNeighbor = node;
    this.previousLevelNode[level] = node;
}

OrigamiTree.prototype._getNodeSize = function (node) {
    switch(this.config.iRootOrientation) {
        case OrigamiTree.RO_TOP:
        case OrigamiTree.RO_BOTTOM:
            return node.w;

        case OrigamiTree.RO_RIGHT:
        case OrigamiTree.RO_LEFT:
            return node.h;
    }
    return 0;
}

OrigamiTree.prototype._getLeftmost = function (node, level, maxlevel) {
    if(level >= maxlevel) return node;
    if(node._getChildrenCount() == 0) return null;

    var n = node._getChildrenCount();
    for(var i = 0; i < n; i++) {
        var iChild = node._getChildAt(i);
        var leftmostDescendant = this._getLeftmost(iChild, level + 1, maxlevel);
        if(leftmostDescendant != null)
            return leftmostDescendant;
    }

    return null;
}

OrigamiTree.prototype.initSearch = function (searchText) {
    if(searchText) {
        this.searchText = searchText;
    }

    if(this.searchText) {
        $(this.searchText).bind('keyup', function() {
            var matches = Array();
            var key = this.value;
            if(!key) return;
            selected_nodes = Array();

            for(var i = 0; i < origamiTree.nDatabaseNodes.length; i = i + 1) {
                cNode = origamiTree.nDatabaseNodes[i];
                if(cNode.origamiData.question.toLowerCase().indexOf(key.toLowerCase()) >= 0) {
                    matches.push(i);
                    selected_nodes.push("" + cNode.id);
                } else if(cNode.origamiData.explanation.toLowerCase().indexOf(key.toLowerCase()) >= 0) {
                    matches.push(i);
                    selected_nodes.push("" + cNode.id);
                }
            }
            if(matches.length >= 1) {
                populate_search_menu(matches.slice(0,5));
            }
        });
    }
};

OrigamiTree.prototype.add = function (id, pid, w, h) {
    var nw = w || this.config.defaultNodeWidth; //Width, height defaults...
    var nh = h || this.config.defaultNodeHeight;

    var pnode = null; //Search for parent node in database
    if (pid == -1) {
        pnode = this.root;
    } else {
        for (var k = 0; k < this.nDatabaseNodes.length; k++) {
            if (this.nDatabaseNodes[k].id == pid) {
                pnode = this.nDatabaseNodes[k];
                break;
            }
        }
    }

    if(!id) { // null id indicates a new node. make an id for it.. this could be better
        id = this.nDatabaseNodes.length;
        while(this.mapIDs[id] != null) {
            id = id + 1;
        }

        id = "new_" + id;
        selected_nodes = [id];
    }

    var node = new OrigamiNode(id, pid, nw, nh);    //New node creation...
    node.nodeParent = pnode;  //Set it's parent
    i = this.nDatabaseNodes.length; //Save it in database
    node.dbIndex = this.mapIDs[id] = i;

    node.origamiData = {
        'question': '',
        'explanation': '',
        'parent_answer': '',
        'product_id': ''
    }

    this.nDatabaseNodes[i] = node;
    h = pnode.nodeChildren.length; //Add it as child of it's parent
    node.siblingIndex = h;
    pnode.nodeChildren[h] = node;

    this.editField();
}

OrigamiTree.prototype.remove = function (id) {
    dbIndex = this.mapIDs[id];
    old_node = this.nDatabaseNodes[dbIndex];

    pIndex = this.mapIDs[old_node.pid];

    if(old_node.pid == -1) {
        parent = this.root;
    } else {
        parent = this.nDatabaseNodes[pIndex];
    }

    for (var k = 0; k < parent.nodeChildren.length; k++) {
        if(parent.nodeChildren[k].id == id) {
            if(k < parent.nodeChildren.length - 1) {
                parent.nodeChildren[k] = parent.nodeChildren[parent.nodeChildren.length - 1];
                parent.nodeChildren.splice(parent.nodeChildren.length - 1, 1);
                break;
            } else {
                parent.nodeChildren.splice(parent.nodeChildren.length - 1, 1);
                break;
            }
        }
    }

    for (var k = 0; k < this.nDatabaseNodes.length; k++) {
        if(this.nDatabaseNodes[k].pid == id) {
            this.nDatabaseNodes[k].pid = -1;
            this.nDatabaseNodes[k].nodeParent = this.root;
            this.nDatabaseNodes[k].siblingIndex = this.root.nodeChildren.length;
            this.root.nodeChildren[this.root.nodeChildren.length] = this.nDatabaseNodes[k];
        }
        if(k == this.nDatabaseNodes.length - 1) {
            this.nDatabaseNodes[dbIndex] = this.nDatabaseNodes[k];
            this.nDatabaseNodes[dbIndex].dbIndex = dbIndex;
            this.mapIDs[this.nDatabaseNodes[k].id] = dbIndex;
        }
    }

    for(var k = 0; k < parent.nodeChildren.length; k++) {
        parent.nodeChildren[k].siblingIndex = k;
        this.nDatabaseNodes[parent.nodeChildren[k].dbIndex] = parent.nodeChildren[k];
    }

    this.nDatabaseNodes.splice(this.nDatabaseNodes.length -1, 1);
}

OrigamiTree.prototype.reparent = function (id, new_parent_id) {
    node_index = this.mapIDs[id];
    target_node = this.nDatabaseNodes[node_index];
    var children = [];

    for(var i = 0; i < target_node.nodeChildren.length; i++) {
        children.push(target_node.nodeChildren[i]);
    }

    this.remove(id);
    this.add(id, new_parent_id, 400, 150);
    new_node_index = this.mapIDs[id];
    this.nDatabaseNodes[new_node_index].origamiData = target_node.origamiData;

    for(var i = 0; i < children.length; i++) {
        this.reparent(children[i].id, id);
    }
}

OrigamiTree.prototype.copy = function (selected_id, new_parent_id, recursive) {
    node_index = this.mapIDs[selected_id];
    var target_node = this.nDatabaseNodes[node_index];
    var children = [];
    var new_id = "";

    suffix = 0;
    do {
        new_id = "copy_" + selected_id + "_" + suffix;
        suffix = suffix + 1;
    } while(this.mapIDs[new_id] != null);

    this.add(new_id, new_parent_id, 400, 150);
    new_node_index = this.mapIDs[new_id];
    this.nDatabaseNodes[new_node_index].origamiData = $().extend({}, target_node.origamiData); // copy by value

    if(recursive) {
        for(var i = 0; i < target_node.nodeChildren.length; i++) {
            this.copy(target_node.nodeChildren[i].id, new_id, recursive);
        }
    }
}

OrigamiTree.prototype._drawTree = function () {
    var node = null;
    $("#node_container").remove();
    var node_group = svg.group("node_container");

    this.XOffset = this.YOffset = this.Width = this.Height = 0;
    var viewBoxAttr = svg._svg.getAttribute("viewBox");
    vx = parseInt(viewBoxAttr.split(/\ /)[0]);
    vy = parseInt(viewBoxAttr.split(/\ /)[1]);
    vw = parseInt(viewBoxAttr.split(/\ /)[2]);
    vh = parseInt(viewBoxAttr.split(/\ /)[3]);

    for (var n = 0; n < this.nDatabaseNodes.length; n++) {
        node = this.nDatabaseNodes[n];

        if(node.XPosition < this.XOffset) { this.XOffset = node.XPosition; }
        if(node.YPosition < this.YOffset) { this.YOffset = node.YPosition; }

        if((node.XPosition + node.w) > (this.XOffset + this.Width)) { this.Width = node.XPosition + node.w - this.XOffset; }
        if((node.YPosition + node.h) > (this.YOffset + this.Height)) { this.Height = node.YPosition + node.h - this.YOffset; }

        //Canvas part...
        node.group = svg.group(node_group);
        if(selected_nodes.indexOf("" + node.id) == -1) {
            if( origamiTree.nDatabaseNodes.length <= 50 ||
                (node.XPosition + node.w >= vx - 256) && (node.XPosition <= vx + vw + 256) &&
                (node.YPosition + node.h >= vy - 64) && (node.YPosition/1.2 <= vy + vh + 64)
              ) {
                node.container = svg.use(node.group, node.XPosition, node.YPosition, node.w, node.h, '#node_container_prototype', {'id': node.id, 'fill': '#9CF'});
                node._drawChildrenLinks(this.self);
            }
        } else {
            node.container = svg.use(node.group, node.XPosition, node.YPosition, node.w, node.h, '#node_container_prototype', {'id': node.id, 'fill': '#FC9'});
            node._drawChildrenLinks(this.self);
        }
    }
}

OrigamiTree.prototype._updateTexts = function() {
    var viewBoxAttr = svg._svg.getAttribute("viewBox");
    vx = parseInt(viewBoxAttr.split(/\ /)[0]);
    vy = parseInt(viewBoxAttr.split(/\ /)[1]);
    vw = parseInt(viewBoxAttr.split(/\ /)[2]);
    vh = parseInt(viewBoxAttr.split(/\ /)[3]);

    for (var n = 0; n < this.nDatabaseNodes.length; n++) {
        node = this.nDatabaseNodes[n];
        if( (node.XPosition + node.w >= vx) && (node.XPosition <= vx + vw) &&
            (node.YPosition + node.h >= vy) && (node.YPosition <= vy + vh)
          ) {
            left = parseInt(node.XPosition) + 12;
            current_height = 24;
            if(node.origamiData) {
                for(var data in Iterator(node.origamiData)) {
                    if(data[1].length == 0) continue;

                    displaystring = data[0] + ": " + data[1];
                    if(displaystring.length > 48) {
                        displaystring = displaystring.substr(0, 48) + "...";
                    }
                    svg.text(node.group, left, parseInt(node.container.getAttribute('y')) + current_height, displaystring, {'font-family': 'monospace'});
                    current_height = current_height + 20;
                }
            }
        }
    }
}

OrigamiTree.prototype.update = function() {
    this._positionTree();
    this._drawTree();
    this._updateTexts();
}

OrigamiTree.prototype.editField = function() {
    var cNode = selected_nodes[0];
    var dbIndex = this.mapIDs[cNode];

    if(selected_nodes.length >= 1) {
        $("#node_editor [name]").each(function() {
            this.value = origamiTree.nDatabaseNodes[dbIndex].origamiData[this.name] || "";
        });
    }

    this.changeEditField();
}

OrigamiTree.prototype.changeEditField = function() {
    $("#editor_field").children().each(function() {
        $("#" + this.value + "_editor").hide();
    });

    if(selected_nodes.length >= 1) {
        var focusField = $("#editor_field")[0].value;
        var editorField = "#" + focusField + "_editor";
        $(editorField).show();
        $(editorField).focus();
    }
}

OrigamiTree.prototype.applyEdit = function() {
    cNode = selected_nodes[0];
    dbIndex = this.mapIDs[cNode];

    $("#node_editor [name]").each(function() {
        origamiTree.nDatabaseNodes[dbIndex].origamiData[this.name] = this.value;
    });
    this.update();
}

OrigamiTree.prototype.condense = function(node) {
    var treeSap = new Array();

    if(!node) {
        if(this.root.nodeChildren.length != 1) {
            alert("The tree must have exactly 1 root node");
            return false;
        }
        node = this.root.nodeChildren[0];
    };

    treeSap.push(node.id);
    treeSap.push(node.nodeParent.id);
    treeSap.push(node.origamiData);
    treeSap.push(new Array());

    $(node.nodeChildren).each(function() {
        treeSap[3].push(origamiTree.condense(this));
    });

    return treeSap;
}

OrigamiTree.prototype.initSaveButton = function(saveButton) {
    if(saveButton) {
        $(saveButton).bind('click', function() {
            treeSap = origamiTree.condense();
            if(treeSap) {
                $.post("/qualification_questions/save_tree.json",
                       {
                           data: $.toJSON(treeSap),
                       },
                       function(result) {
                           alert(result);
                       }, 'json');
            }
        });
    }
}

OrigamiTree.prototype.initExportButton = function(exportButton) {
    if(exportButton) {
        $(exportButton).bind('click', function() {
            treeSap = origamiTree.condense();
            treeName = origamiTree.nDatabaseNodes[0].origamiData.parent_answer.replace(/ /g, "_");
            if(treeSap) {
                $("form#hidden_form").empty();
                $("form#hidden_form").attr('method', 'POST')
                $("form#hidden_form").attr('action', '/qualification_questions/export/' + treeName);
                $("form#hidden_form").append("<input type='hidden' id='treeSap' name='treeSap' />");
                $("form#hidden_form>#treeSap").val($.toJSON(treeSap));
                $("form#hidden_form").submit();
            }
        });
    }
}

OrigamiTree.prototype.importTreeData = function(treeData, parent) {
    if(!parent) parent = -1;

    if(treeData.QualificationQuestion) { // csv import
        var nodeData = treeData.QualificationQuestion;
        nodeData.children = treeData.children;
    } else { // sap import
        var nodeData = treeData[2];
        nodeData.id = treeData[0];
        nodeData.children = treeData[3];
    }

    origamiTree.add(nodeData.id, parent, 400, 150);
    update_node_text(nodeData.id, nodeData);

    for (var i = 0; i < nodeData.children.length; i++) {
        origamiTree.importTreeData(nodeData.children[i], nodeData.id);
    }
}

OrigamiTree.prototype.initImportButton = function(importButton) {
    if(importButton) {
        new AjaxUpload($(importButton), {
            action: '/qualification_questions/import.json',
            name: 'importFile',
            autoSubmit: true,
            responseType: "json",
            onComplete: function(file, response) {
                origamiTree = new OrigamiTree();
                origamiTree.importTreeData(response);
                origamiTree.update();
                generate_thumbnail();
            }
        });
    }
}

function flash_message(message, message_type, flash_duration) {
    if(message) {
        if(!message_type || message_type == '') {
            message_type = "info";
        }
        if(!flash_duration || flash_duration == '') {
            flash_duration = 10000;
        }
        if($("#status_message").length) {
            $("#status_message").fadeOut(
                "slow",
                function() {
                    $("#status_message").remove();
                    flash_message(message, message_type, flash_duration);
                }
            );
        } else {
            $("#head_right").append('<div id="status_message" class="'+message_type+'"><span>'+message+'</span></div>');
            $("#status_message").fadeIn(
                "slow",
                function() {
                    setTimeout(
                        function() {
                            $("#status_message").fadeOut(
                                "slow",
                                function() { $("#status_message").remove(); }
                            );
                        },
                        flash_duration
                    );
                }
            );
        }
    }
}

/**
 * END Origami Tree Code
 */

function drag(evt) {
    if(drag_canvas) {
        var current_scale = parseFloat($("svg")[0].getAttribute("rel"));
        dx = Math.round((evt.clientX - ox) / current_scale);
        dy = Math.round((evt.clientY - oy) / current_scale);

        var viewBoxAttr = svg._svg.getAttribute("viewBox");
        vx = parseInt(viewBoxAttr.split(/\ /)[0]);
        vy = parseInt(viewBoxAttr.split(/\ /)[1]);
        vw = parseInt(viewBoxAttr.split(/\ /)[2]);
        vh = parseInt(viewBoxAttr.split(/\ /)[3]);

        thumb_x_scale = parseFloat(origamiTree.Width / 240);
        thumb_y_scale = parseFloat(origamiTree.Height / 180);
        if(thumb_x_scale > thumb_y_scale) {
            thumb_scale = thumb_x_scale;
        } else {
            thumb_scale = thumb_y_scale;
        }

        if(
            (dx < 0 && (cx + dx) < origamiTree.XOffset - 4) ||
            (dx > 0 && (cx + dx + vw) > (origamiTree.XOffset + origamiTree.Width + 4))
        ) {
            dx = 0;
            cx = vx;
        }
        if(
            (dy < 0 && (cy + dy) < origamiTree.YOffset - 4) ||
            (dy > 0 && (cy + dy + vh) > (origamiTree.YOffset + origamiTree.Height + 4))
        ) {
            dy = 0;
            cy = vy;
        }

//        $("#node_container")[0].setAttribute('transform', 'translate(' + -dx + ',' + -dy + ')');

        drag_canvas.setAttribute("viewBox", (cx + dx)+" "+(cy + dy)+" "+sx+" "+sy);

        viewbox_x = Math.round((cx + dx - origamiTree.XOffset) / thumb_scale) - 1;
        viewbox_y = Math.round((cy + dy - origamiTree.YOffset) / thumb_scale) - 1;
        if(viewbox_x < 0) { viewbox_x = 0; }
        if(viewbox_y < 0) { viewbox_y = 0; }
        $("#viewbox").css("left", (viewbox_x)+'px');
        $("#viewbox").css("top", (viewbox_y)+'px');
    }
}

function start_dragging(evt) {
    if(evt.which == 3) {
        evt.stopPropagation();
        evt.preventDefault();
        popup_menu(evt, "rightclick");
        return false;
    } else {
        drag_canvas = svg._svg;
        var viewBoxAttr = svg._svg.getAttribute("viewBox");
        cx = parseInt(viewBoxAttr.split(/\ /)[0]);
        cy = parseInt(viewBoxAttr.split(/\ /)[1]);
        sx = parseInt(viewBoxAttr.split(/\ /)[2]);
        sy = parseInt(viewBoxAttr.split(/\ /)[3]);
        dx = 0;
        dy = 0;
        ox = evt.clientX;
        oy = evt.clientY;
    }
}

function stop_dragging(evt) {
    if(drag_canvas) {
        drag_canvas = null;
    }

    if(Math.abs(dx) + Math.abs(dy) < 4) {
        drag_canvas = false;
    } else {
        origamiTree.update();
    }

}

function kill_node(evt) {
    var kill_target;

    kill_target = getContainingNode(evt.target);

    origamiTree.remove(kill_target.id);

/* should attach orphans to grandparent some day?.. orphan for now
    buttons = $(kill_target).siblings("[href=#attach_button_prototype]")
    for(i=0; i < buttons.length; i = i+1) {
        $(buttons[i].line).remove();
    }
*/

    origamiTree.update();
    generate_thumbnail();
    return false;
}

function getContainingNode(el) {
    if(el.correspondingUseElement) {
        return (el.correspondingUseElement);
    }

    return $(el).parents('[href=#node_container_prototype]')[0];
}

function add_node(evt, id, parent, skipUpdate) {
    if(evt) {
        parent = getContainingNode(evt.target);
        origamiTree.add(id, parent.id, 400, 150);
        evt.stopPropagation();
        evt.preventDefault();
    } else {
        origamiTree.add(id, parent, 400, 150);
    }

    if(skipUpdate == null) {
        origamiTree.update();
        generate_thumbnail();
    }

    return false;
}

function update_node_text(id, nodeData) {
    var dbIndex = origamiTree.mapIDs[id];

    if(dbIndex != null) {
        $.each(nodeData, function(k,v) {
            if(k != "id" && k != "children") {
                origamiTree.nDatabaseNodes[dbIndex].origamiData[k] = $.URLDecode(v);
            }
        });
    }
}

function control_canvas(act, dir, val, animate) {
    var current_scale = parseFloat($("svg")[0].getAttribute("rel"));
    var viewBoxAttr = $("svg")[0].getAttribute("viewBox");
    var x_offset = parseInt(viewBoxAttr.split(/\ /)[0]);
    var y_offset = parseInt(viewBoxAttr.split(/\ /)[1]);
    var x_size = parseInt(viewBoxAttr.split(/\ /)[2]);
    var y_size = parseInt(viewBoxAttr.split(/\ /)[3]);
    var new_x_offset, new_y_offset;
    var new_scale = null;

    switch(act) {
        case "move":
            var increment = parseInt(10 / current_scale);
            var x_increment = 0;
            var y_increment = 0;
            if(["w", "nw", "sw"].indexOf(dir) >= 0) x_increment = increment * -1;
            if(["e", "ne", "se"].indexOf(dir) >= 0) x_increment = increment;
            if(["n", "nw", "ne"].indexOf(dir) >= 0) y_increment = increment * -1;
            if(["s", "sw", "se"].indexOf(dir) >= 0) y_increment = increment;

            switch(dir) {
                case "n": case "ne": case "e": case "se":
                case "s": case "sw": case "w": case "nw":
                    new_x_offset = parseFloat(x_offset + x_increment);
                    new_y_offset = parseFloat(y_offset + y_increment);
                    break;
                case "center":
                    new_x_offset = parseInt(val.split(/,/)[0]) - (x_size/4);
                    new_y_offset = parseInt(val.split(/,/)[1]) - (y_size/4);
                    break;
                case "absolute":
                default:
                    new_x_offset = parseInt(val.split(/,/)[0]);
                    new_y_offset = parseInt(val.split(/,/)[1]);
                    break;
            }
            break;
        case "zoom":
            var scale_diff;
            var x_scale_modifier;
            var y_scale_modifier;
            var x_orig_size = parseInt($("svg")[0].getAttribute("width"));
            var y_orig_size = parseInt($("svg")[0].getAttribute("height"));
            if(((current_scale <= 0.1 && dir == "out") || (current_scale >= 2 && dir == "in")) && !val) return false;

            if(!val) {
                switch(dir) {
                    case "in":
                        new_scale = current_scale + 0.1;
                        break;
                    case "out":
                        new_scale = current_scale - 0.1;
                        break;
                    default:
                        return false;
                }
            } else {
                new_scale = val;
            }
            x_scale_modifier = x_orig_size / new_scale;
            y_scale_modifier = y_orig_size / new_scale;
            new_x_offset = Math.round(x_offset + ((x_size - x_scale_modifier) / 2));
            new_y_offset = Math.round(y_offset + ((y_size - y_scale_modifier) / 2));
            x_size = Math.round(x_scale_modifier);
            y_size = Math.round(y_scale_modifier);

            break;
    }

    if(new_x_offset <= origamiTree.XOffset) {
        new_x_offset = x_offset;
    }

    if(new_y_offset <= origamiTree.YOffset) {
        new_y_offset = y_offset;
    }

    if(x_size > origamiTree.Width) {
        x_size = origamiTree.Width;
    }
    if(y_size > origamiTree.Height) {
        y_size = origamiTree.Height;
    }

    if((new_x_offset + x_size) > (origamiTree.XOffset + origamiTree.Width)) {
        new_x_offset = origamiTree.XOffset + origamiTree.Width - x_size;
    }
    if((new_y_offset + y_size) > (origamiTree.YOffset + origamiTree.Height)) {
        new_y_offset = origamiTree.YOffset + origamiTree.Height - y_size;
    }

/*
    if((new_x_offset + x_size) > (origamiTree.XOffset + origamiTree.Width)) {
        x_size = origamiTree.XOffset + origamiTree.Width - new_x_offset;
    }
    if((new_y_offset + y_size) > (origamiTree.YOffset + origamiTree.Height)) {
        y_size = origamiTree.YOffset + origamiTree.Height - new_y_offset;
    }
*/

    if(animate) {
        $("svg").animate({'svg-viewBox': new_x_offset + " " + new_y_offset + " " + x_size + " " + y_size}, 2000);
    } else {
        $("svg")[0].setAttribute("viewBox", new_x_offset+" "+new_y_offset+" "+x_size+" "+y_size);
    }

    if(new_scale) {
/*
        cx_scale = x_size / origamiTree.Width;
        cy_scale = y_size / origamiTree.Height;

        if(cx_scale == 1) {
            new_scale = $("svg")[0].getAttribute("width") / origamiTree.Width;
        } else if (cy_scale == 1) {
            new_scale = $("svg")[0].getAttribute("height") / origamiTree.Height;
        }
*/
        $("svg")[0].setAttribute("rel", new_scale);
    }
    origamiTree.update();
}

function select_node(evt) {
    if($("#popup_menu_container").length > 0) {
        $("#popup_menu_container").remove();
        generate_thumbnail();
        evt.stopPropagation();
        evt.preventDefault();
        return false;
    }

    if(drag_canvas == false) {
        if(evt.target.nodeName != "svg") {
            var target_node = getContainingNode(evt.target);
            if(!target_node) {return;};

            if(selected_nodes.length == 0) {
                selected_nodes = ["" + target_node.id];
            } else {
                if(selected_nodes.indexOf("" + target_node.id) == -1) {
                    popup_menu(evt, "drop");
                } else {
                    if(selected_nodes.length > 1) {
                        selected_nodes = ["" + target_node.id];
                    } else {
                        select_children(target_node.id);
                    }
                }
            }
        } else {
            selected_nodes = [];
        }
    }

    origamiTree.editField();
    origamiTree.update();
    evt.stopPropagation();
    evt.preventDefault();
}

function select_children(node_id) {
    dbIndex = origamiTree.mapIDs[node_id];
    current_node = origamiTree.nDatabaseNodes[dbIndex];
    var foo;

    $(current_node.nodeChildren).each(function() {
        selected_nodes.push("" + this.id);
        if(this.nodeChildren.length > 0)
            foo = select_children(this.id);
    });
}

function populate_search_menu(matches) {
    if(matches.length) {
        $("#search_results").remove();
        $("#searchbox").append("<div id='search_results'></div>");
        for(var i = 0; i < matches.length; i = i+1) {
            var cNode = origamiTree.nDatabaseNodes[matches[i]];
            if(cNode.origamiData.question.length) {
                $("#search_results").append('<a href="#" class="select_node" rel="' + cNode.id + '">' + cNode.origamiData.question + "</a>");
            } else {
                $("#search_results").append('<a href="#" class="select_node" rel="' + cNode.id + '">' + cNode.origamiData.explanation + "</a>");
            }
        }
        $("a.select_node").bind("click", function() {
            dbIndex = origamiTree.mapIDs[this.rel];

            var new_x = origamiTree.nDatabaseNodes[dbIndex].XPosition;
            var new_y = origamiTree.nDatabaseNodes[dbIndex].YPosition;
            control_canvas("move", "center", new_x + "," + new_y, true);
            origamiTree.update();
            generate_thumbnail();
            $("#search_results").remove();
        });
    }
}

function populate_rightclick_menu(evt) {
    if(evt.originalTarget) {
        var target_node = getContainingNode(evt.originalTarget);
        var target_node_id = parseInt(target_node.id);

        $("#popup_menu_container").append('<div id="rightclick_menu" class="popup_menu"></div>');
        $("#rightclick_menu").append('<a href="#" class="ext_edit_here">Edit in External Editor</a>');
        $("#rightclick_menu").append('<a href="#" class="popup_select_button">Select Node</a>');
        $("#rightclick_menu").append('<a href="#" class="popup_selectall_button">Select Node and Children</a>');
        $("#rightclick_menu").append('<a href="#" class="popup_copy_button">Copy Selection to Clipboard</a>');
        $("#rightclick_menu").append('<a href="#" class="cancel">Cancel</a>');
        $("a.ext_edit_here").bind("click", function() {
            window.open('/qualification_questions/question/' + target_node_id);
        });
        $("a.popup_select_button").bind("click", function() {
            selected_nodes = ["" + target_node_id];
            origamiTree.update();
            generate_thumbnail();
            $("#popup_menu_container").remove();
            return false;
        });
        $("a.popup_selectall_button").bind("click", function() {
            selected_nodes = ["" + target_node_id];
            select_children(target_node_id);
            origamiTree.update();
            generate_thumbnail();
            $("#popup_menu_container").remove();
            return false;
        });
        $("a.popup_copy_button").bind("click", function() { alert("copy logic"); $("#popup_menu_container").remove(); return false; });
        $("a.cancel").bind("click", function() { $("#popup_menu_container").remove(); return false; });
    }
}

function populate_drop_menu(evt) {
    if(evt.target) {
        var target_node = getContainingNode(evt.target);
        var target_node_id = parseInt(target_node.id);

        $("#popup_menu_container").append('<div id="drop_menu" class="popup_menu"></div>');
        $("#drop_menu").append('<a href="#" class="move_here">Move and Reparent Here</a>');
        $("#drop_menu").append('<a href="#" class="copy_here">Copy and Reparent Here</a>');
        $("#drop_menu").append('<a href="#" class="cancel">Cancel</a>');
        $("a.move_here").bind("click", function() {
            origamiTree.reparent(selected_nodes[0], target_node_id);
            origamiTree.update();
            generate_thumbnail();
            $("#popup_menu_container").remove();
            return false;
        });
        $("a.copy_here").bind("click", function() {
            origamiTree.copy(selected_nodes[0], target_node_id, (selected_nodes.length>1));
            origamiTree.update();
            generate_thumbnail();
            $("#popup_menu_container").remove();
            return false;
        });
        $("a.cancel").bind("click", function() { $("#popup_menu_container").remove(); return false; });
    }
}

function popup_menu(evt, type) {
    $("#popup_menu_container").remove();
    var populate_helper = "populate_" + type + "_menu";
    if(typeof(populate_helper == "function")) {
        $("#searchbox").after('<div id="popup_menu_container"></div>');
        helper_function = new Function("evt", populate_helper + "(evt);");
        helper_function(evt);
        $("#popup_menu_container").css("top", evt.clientY);
        $("#popup_menu_container").css("left", evt.clientX);
    }
}

function setup_nodes() {
    nodes = svg.defs('nodes');

    node_container = svg.symbol(nodes, 'node_container_prototype', 0, 0, 400, 150, {preserveAspectRatio: "none", onclick: "select_node(evt)"});
    svg.rect(node_container,3,3,394,144,11,11,{
        id: 'node_container_frame',
        fill: '#069',
        'fill-opacity': 0.2,
    });
    node_container.rect = svg.rect(node_container,4,4,392,142,10,10,{
        id: 'node_container_frame',
        fill: 'inherit',
        'fill-opacity': 1.0,
    });

    svg.use(node_container, 374, 8, 18, 18, '#close_button_prototype', {onclick: "kill_node(evt)"});
    svg.use(node_container, 374, 124, 18, 18, '#add_button_prototype', {onclick: "add_node(evt)"});
}

function setup_buttons() {
    buttons = svg.defs('buttons');

    close_button = svg.symbol(buttons, 'close_button_prototype', 0, 0, 12, 12);
    svg.circle(close_button, 6, 6, 5, {
        id: 'close_button_prototype_circle',
        'fill-opacity': 0,
        'stroke-width': 0,
    });
    svg.line(close_button, 3.88, 8.12, 8.12, 3.88, {
        id: 'close_button_prototype_inner_line_1',
        stroke: '#FFF',
        'stroke-width': 2
    });
    svg.line(close_button, 3.88, 3.88, 8.12, 8.12, {
        id: 'close_button_prototype_inner_line_2',
        stroke: '#FFF',
        'stroke-width': 2
    });

    add_button = svg.symbol(buttons, 'add_button_prototype', 0, 0, 12, 12);
    svg.circle(add_button, 6, 6, 5, {
        id: 'add_button_prototype_circle',
        'fill-opacity': 0,
        'stroke-width': 0,
    });
    svg.line(add_button, 3, 6, 9, 6, {
        id: 'add_button_prototype_inner_line_1',
        stroke: '#FFF',
        'stroke-width': 2
    });
    svg.line(add_button, 6, 3, 6, 9, {
        id: 'add_button_prototype_inner_line_2',
        stroke: '#FFF',
        'stroke-width': 2
    });

    attach_button = svg.symbol(buttons, 'attach_button_prototype', 0, 0, 12, 12);
    svg.circle(attach_button, 6, 6, 5, {
        id: 'attach_button_prototype_circle',
        fill: '#9CF',
        'fill-opacity': 1,
        stroke: '#069',
        'stroke-width': 1,
        'stroke-opacity': 0.2
    });
    svg.circle(attach_button, 6, 6, 1, {
        id: 'attach_button_prototype_inner_dot',
        fill: '#FFF',
        'fill-opacity': 1
    });
}

function size_me(sidewidth) {
    sidewidth = parseInt(sidewidth);
    var viewport_width = parseInt(window.innerWidth);
    var viewport_height = parseInt(window.innerHeight);
    main_svg_width = parseInt(viewport_width - sidewidth);
    main_svg_height = parseInt(viewport_height - 150);
    $("#head_right").css("width", parseInt(viewport_width - 490)+'px');
    $("#top_border").css("width", main_svg_width+'px');
    $("#right_border").css("height", parseInt(main_svg_height + 40)+'px');
    $("#right_border").css("left", parseInt(main_svg_width + 20)+'px');
    $("#bottom_border").css("top", parseInt(main_svg_height + 100)+'px');
    $("#bottom_border").css("width", main_svg_width+'px');
    $("#left_border").css("height", parseInt(main_svg_height + 40)+'px');
    $("a.no-zoom").css("top", parseInt((main_svg_height / 2) + 30)+'px');
    $("#canvas").css("width", main_svg_width+'px');
    $("#canvas").css("height", main_svg_height+'px');
    $("#sidebar").css("height", parseInt(viewport_height - 80)+'px');
    $("#toggle_sidebar").css("height", parseInt(viewport_height - 80)+'px');
    $("#edit").css("height", parseInt(viewport_height - 270)+'px');
    $(".node_textarea").css("height", parseInt(viewport_height - 374)+'px');
    $("#searchbox").css("width", parseInt(main_svg_width + 40)+'px');
    $("#search_results").css("width", parseInt(main_svg_width - 90)+'px');
    $("#search").css("width", parseInt(main_svg_width - 90)+'px');
    generate_thumbnail();
}

function hide_sidebar() {
    sidewidth = 50;
    var current_scale = parseFloat($("svg")[0].getAttribute("rel"));
    var viewBoxAttr = svg._svg.getAttribute("viewBox");
    var x_offset = parseInt(viewBoxAttr.split(/\ /)[0]);
    var y_offset = parseInt(viewBoxAttr.split(/\ /)[1]);
    size_me(sidewidth);
    var new_main_svg_width = Math.round(main_svg_width / current_scale);
    var new_main_svg_height = Math.round(main_svg_height / current_scale);
    $("svg")[0].setAttribute("width", main_svg_width);
    $("svg")[0].setAttribute("height", main_svg_height);
    $("svg")[0].setAttribute("viewBox", x_offset+" "+y_offset+" "+new_main_svg_width+" "+new_main_svg_height);
    $("#sidebar").css("display", "none");
    $("#thumbnail_container").css("display", "none");
    $("#thumbnail").css("display", "none");
    $("#viewbox").css("display", "none");
    $("#edit").css("display", "none");
    thumbnail = 0;
    $("#toggle_sidebar").attr("class", "show_sidebar");
    $("#toggle_sidebar a").replaceWith('<a href="#">&lt;</a>');
    $("#toggle_sidebar a").bind("click", show_sidebar);
    return false;
}

function show_sidebar() {
    sidewidth = 300;
    var current_scale = parseFloat($("svg")[0].getAttribute("rel"));
    var viewBoxAttr = svg._svg.getAttribute("viewBox");
    var x_offset = parseInt(viewBoxAttr.split(/\ /)[0]);
    var y_offset = parseInt(viewBoxAttr.split(/\ /)[1]);
    size_me(sidewidth);
    var new_main_svg_width = Math.round(main_svg_width / current_scale);
    var new_main_svg_height = Math.round(main_svg_height / current_scale);
    $("svg")[0].setAttribute("width", main_svg_width);
    $("svg")[0].setAttribute("height", main_svg_height);
    $("svg")[0].setAttribute("viewBox", x_offset+" "+y_offset+" "+new_main_svg_width+" "+new_main_svg_height);
    $("#sidebar").css("display", "block");
    $("#thumbnail_container").css("display", "block");
    $("#thumbnail").css("display", "block");
    $("#viewbox").css("display", "block");
    $("#edit").css("display", "block");
    thumbnail = 1;
    $("#toggle_sidebar").attr("class", "hide_sidebar");
    $("#toggle_sidebar a").replaceWith('<a href="#">&gt;</a>');
    $("#toggle_sidebar a").bind("click", hide_sidebar);
    origamiTree.update();
    return false;
}

function generate_thumbnail() {
    if(thumbnail && origamiTree.Width > 0 && origamiTree.Height > 0) {
        var current_scale = parseFloat($("svg")[0].getAttribute("rel"));
        var thumb_scale, viewbox_x, viewbox_y, viewbox_width, viewbox_height;
        var viewBoxAttr = svg._svg.getAttribute("viewBox");
        var canvas_x_offset = parseInt(viewBoxAttr.split(/\ /)[0]);
        var canvas_y_offset = parseInt(viewBoxAttr.split(/\ /)[1]);
        var canvas_width = parseInt(viewBoxAttr.split(/\ /)[2]);
        var canvas_height = parseInt(viewBoxAttr.split(/\ /)[3]);
        var canvas_aspect = $("#canvas")[0].clientWidth / $("#canvas")[0].clientHeight;

        var thumb_x_scale = parseFloat(origamiTree.Width / 240);
        var thumb_y_scale = parseFloat(origamiTree.Height / 180);
        if(thumb_x_scale > thumb_y_scale) {
            thumb_scale = thumb_x_scale;
        } else {
            thumb_scale = thumb_y_scale;
        }

        var thumb_width = Math.round(origamiTree.Width / thumb_scale);
        var thumb_height = Math.round(origamiTree.Height / thumb_scale);

        viewbox_x = (canvas_x_offset - origamiTree.XOffset) / thumb_scale;
        viewbox_y = (canvas_y_offset - origamiTree.YOffset) / thumb_scale;
        viewbox_width = canvas_width / thumb_scale;
        viewbox_height = canvas_height / thumb_scale;

        var new_viewbox_width = viewbox_width;
        var new_viewbox_height = viewbox_height;

        if(viewbox_x + viewbox_width > (thumb_width)) {
            viewbox_width = thumb_width - viewbox_x - 8;
        }

        if(viewbox_width > (canvas_aspect * viewbox_height) + 1) {
            new_viewbox_height = viewbox_width / canvas_aspect;
            dy = (new_viewbox_height - viewbox_height)/2;
            viewbox_y = viewbox_y - dy;
            viewbox_height = new_viewbox_height;
        }

        if(viewbox_height > (viewbox_width / canvas_aspect) + 1) {
            new_viewbox_width = viewbox_height * canvas_aspect;
            dx = (new_viewbox_width - viewbox_width)/2;
            viewbox_x = viewbox_x - dx;
            viewbox_width = new_viewbox_width;
        }

        if($("#thumbnail")) {
            $("#viewbox").appendTo("#sidebar");
            $("#thumbnail").remove();
        }
        $("#canvas").clone().attr("id", "thumbnail").prependTo("#thumbnail_container");
        $("#thumbnail").css("width", thumb_width+'px');
        $("#thumbnail").css("height", thumb_height+'px');
        $("#thumbnail").css("top", parseInt(4 + Math.round((180 - thumb_height) / 2)));
        $("#thumbnail").css("left", parseInt(4 + Math.round((240 - thumb_width) / 2)));
        $("#thumbnail")[0].removeAttribute("class");
        $("svg")[1].setAttribute("viewBox", origamiTree.XOffset+" "+origamiTree.YOffset+" "+origamiTree.Width+" "+origamiTree.Height);
        $("svg")[1].setAttribute("width", thumb_width);
        $("svg")[1].setAttribute("height", thumb_height);
        $("svg")[1].removeAttribute("onmouseup");
        $("svg")[1].removeAttribute("onmousemove");
        $("svg")[1].removeAttribute("onmousedown");
        $("svg")[1].removeAttribute("rel");
        $("symbol")[7].removeAttribute("onclick");
        $("#thumbnail").contents().find("text").remove();
        $("#viewbox").appendTo("#thumbnail");
        $("#viewbox").css("display", "block");
        $("#viewbox").css("width", Math.round(viewbox_width)+'px');
        $("#viewbox").css("height", Math.round(viewbox_height)+'px');
        $("#viewbox").css("top", Math.round(viewbox_y)+'px');
        $("#viewbox").css("left", Math.round(viewbox_x)+'px');
        //$("#viewbox").draggable({ containment: "#thumbnail", start: function() {}, stop: function() {} });
    }
}

$(document).ready(function() {
    window.oncontextmenu = function() { return false; };
    sidewidth = 300;
    size_me(sidewidth);
    var canvas = $('#canvas');
    $(canvas).bind("mouseleave", function(evt) { drag_canvas = null; });
    canvas.svg({settings: {rel:"1",onmousedown:"start_dragging(evt)",onmousemove:"drag(evt)",onmouseup:"stop_dragging(evt)",onclick:"select_node(evt)",viewBox:"0 0 "+main_svg_width+" "+main_svg_height}});
    svg = canvas.svg('get');
    setup_buttons();
    setup_nodes();
    origamiTree = new OrigamiTree();

    $(window).bind("resize", function() {
        var current_scale = parseFloat($("svg")[0].getAttribute("rel"));
        var viewBoxAttr = svg._svg.getAttribute("viewBox");
        var x_offset = parseInt(viewBoxAttr.split(/\ /)[0]);
        var y_offset = parseInt(viewBoxAttr.split(/\ /)[1]);
        size_me(sidewidth);
        var new_main_svg_width = Math.round(main_svg_width / current_scale);
        var new_main_svg_height = Math.round(main_svg_height / current_scale);
        $("svg")[0].setAttribute("width", main_svg_width);
        $("svg")[0].setAttribute("height", main_svg_height);
        $("svg")[0].setAttribute("viewBox", x_offset+" "+y_offset+" "+new_main_svg_width+" "+new_main_svg_height);
        origamiTree.update();
    });
    $("#canvas").mousewheel(function(event, delta) {
        var current_scale = parseFloat($("svg")[0].getAttribute("rel"));
        var increment = parseFloat(delta * 0.1);

        viewBoxAttr = svg._svg.getAttribute("viewBox");
        x_offset = parseInt(viewBoxAttr.split(/\ /)[0]);
        y_offset = parseInt(viewBoxAttr.split(/\ /)[1]);
        x_size = parseInt(viewBoxAttr.split(/\ /)[2]);
        y_size = parseInt(viewBoxAttr.split(/\ /)[3]);

        var client_mouse_x = event.clientX - 20;
        var client_mouse_y = event.clientY - 100;
        scaled_mouse_x = client_mouse_x / current_scale;
        scaled_mouse_y = client_mouse_y / current_scale;
        var mouse_x = scaled_mouse_x + x_offset;
        var mouse_y = scaled_mouse_y + y_offset;

        x_new_offset = Math.round(mouse_x - parseFloat((client_mouse_x / (current_scale + increment))));
        y_new_offset = Math.round(mouse_y - parseFloat((client_mouse_y / (current_scale + increment))));

        if(delta > 0) {
            control_canvas("zoom", "in", null);
        } else {
            control_canvas("zoom", "out", null);
        }
        control_canvas("move", "absolute", x_new_offset + "," + y_new_offset);
        return false; // prevent default (scrolling) action
    });
    $("span a").each(function() {
        var act = $(this).parent().attr("class");
        var dir = $(this).attr("class");
        $(this).mousehold(function() { control_canvas(act, dir); });
        $(this).bind("click", function() { control_canvas(act, dir); return false; });
    });
    $("a.in-full").bind("click", function() { control_canvas("zoom", "in", 2.0); return false; });
    $("a.out-full").bind("click", function() { control_canvas("zoom", "out", 0.1); return false; });
    $("a.no-zoom").bind("click", function() { control_canvas("zoom", null, 1.0); return false; });
    $("a.normal").bind("click", function() { control_canvas("move", null, "0,0"); return false; });
    $("div.hide_sidebar a").bind("click", hide_sidebar);
    $("#toolbar a").bind("click", function() { return false; });
    thumbnail = 1;
    generate_thumbnail();
});
