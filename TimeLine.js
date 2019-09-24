"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
/**
 * Detect collusion from a given range (TriggerProints)
 * */
var TimeLineCollusionRanger = /** @class */ (function () {
    function TimeLineCollusionRanger() {
        this.collusionsMapper = {
            hasCollusion: false,
            current: null,
            prev: null, // prev item inside mapper
        };
        this.drawVisibleRanger();
    }
    TimeLineCollusionRanger.prototype.drawVisibleRanger = function () {
        if (!TimeLineCollusionRanger.triggerPoint.drawRanger ||
            document.querySelector(".timeline-ranger-helper"))
            return;
        var $div = document.createElement("div");
        var points = TimeLineCollusionRanger.triggerPoint;
        $div.innerHTML = "<div style=\"opacity: 0.1;position: fixed;top: " + points.top + "px;height: " + points.height + "px;width: 100%;background: #ff2b2b\" class=\"timeline-ranger-helper\"></div>";
        document.body.appendChild($div);
    };
    TimeLineCollusionRanger.prototype.hasCollusion = function () {
        return this.collusionsMapper.hasCollusion;
    };
    /**
     * Verify is item is inside range
     * @item <TimelineItem>
     * */
    TimeLineCollusionRanger.prototype.itemIsInsideRange = function (item) {
        var range = TimeLineCollusionRanger;
        var _a = (item.getParentElement()).getBoundingClientRect(), top = _a.top, height = _a.height;
        var isInsideTop = top > range.triggerPoint.top &&
            top < range.triggerPoint.top + range.triggerPoint.height;
        var isInsideBottom = top + height > range.triggerPoint.top &&
            top + height < range.triggerPoint.top + range.triggerPoint.height;
        if (isInsideTop || isInsideBottom) {
            return true;
        }
    };
    /**
     * Verify is item is inside browser viewport
     * @item <TimelineItem>
     * @setValue saves the value to the pased item
     * */
    TimeLineCollusionRanger.prototype.itemIsInView = function (item, setValue) {
        if (setValue === void 0) { setValue = true; }
        var _a = (item.getParentElement()).getBoundingClientRect(), top = _a.top, height = _a.height;
        if (setValue) {
            item.isInView = top < window.innerHeight && top + height >= 0;
            return item.isInView;
        }
        else {
            return top < window.innerHeight && top + height >= 0;
        }
    };
    TimeLineCollusionRanger.triggerPoint = {
        height: 90,
        top: (function () {
            return window.innerWidth < 690 ? 150 : 400;
        })(),
        drawRanger: false,
    };
    return TimeLineCollusionRanger;
}());
/*-------------------------------------------------------------------------------*/
var TimelineItem = /** @class */ (function () {
    function TimelineItem($item) {
        var _a;
        this.$item = $item;
        /* Is the first child element from the container  */
        this.isFirst = false;
        /* Is betweeen window height and 0 */
        this.isInView = false;
        this.isActivated = true;
        this.state = false;
        this.ON = {
            click: {
                image: function (item, ev) { return null; },
            },
        };
        this.initListeners();
        this.isFirst = !((_a = $item.parentElement) === null || _a === void 0 ? void 0 : _a.previousElementSibling);
    }
    Object.defineProperty(TimelineItem.prototype, "element", {
        get: function () {
            return this.$item;
        },
        enumerable: false,
        configurable: true
    });
    TimelineItem.prototype.initListeners = function () {
        var _this = this;
        // animation
        this.$item.ontransitionend = function (ev) {
            _this.isActivated = _this.$item.classList.contains("active");
            if (!_this.state && _this.isActivated) {
                _this.$item.classList.remove("active");
            }
        };
        // image
        var parent = this.getParentElement();
        var imgs = __spreadArray([], parent.parentElement.parentElement.querySelectorAll(".timeline-item-content--images img"));
        imgs.map(function ($img) {
            if (!$img.dataset.listener) {
                $img.dataset.listener = $img.addEventListener("click", function (ev) {
                    return _this.ON.click.image(_this, ev);
                });
            }
        });
    };
    TimelineItem.prototype.getParentElement = function () {
        return this.$item.parentElement;
    };
    TimelineItem.prototype.getSideBarElements = function () {
        var _a, _b, _c;
        if (this.isFirst) {
            return __spreadArray([], ((_c = (_b = (_a = this.getParentElement()) === null || _a === void 0 ? void 0 : _a.parentElement) === null || _b === void 0 ? void 0 : _b.parentElement) === null || _c === void 0 ? void 0 : _c.querySelectorAll(".timeline-item")));
        }
        return [];
    };
    TimelineItem.prototype.setState = function (state) {
        this.state = state;
        if (state) {
            if (!this.$item.classList.contains("active"))
                this.$item.classList.add("active");
        }
        else {
            if (this.isActivated) {
                this.$item.classList.remove("active");
            }
        }
    };
    return TimelineItem;
}());
/*-------------------------------------------------------------------------------*/
var Timeline = /** @class */ (function () {
    function Timeline($containerElement) {
        this.$containerElement = $containerElement;
        this.lineRanger = new TimeLineCollusionRanger();
        this.inti();
    }
    Timeline.prototype.inti = function () {
        this.initContainer();
        this.initItems();
        this.initListeners();
    };
    Timeline.prototype.initContainer = function () {
        if (typeof this.$containerElement === "string") {
            this.$containerElement = document.querySelector(this.$containerElement);
        }
        if (!this.$containerElement)
            throw new Error("DomElementNotFound: Container not found");
    };
    /**
     * Initialise all Items with the class<TimelineItem>
     * */
    Timeline.prototype.initItems = function () {
        this.$containerElement.items = __spreadArray([], this.$containerElement.querySelectorAll(Timeline.itemSelector)).map(function (v) { return new TimelineItem(v); });
        this.setItemVisibility();
        this.setItemColor();
    };
    /**
     * Adding Dom Listeners
     * */
    Timeline.prototype.initListeners = function () {
        var _this = this;
        /**Global*/
        document.addEventListener("scroll", function (ev) { return _this.handleScroll(ev); });
        window.addEventListener("resize", function () {
            _this.setItemVisibility();
            _this.setItemColor();
        });
        /*Item based*/
        this.$containerElement.items.forEach(function (item) {
            return (item.ON.click.image = function (item, ev) {
                return _this.handleItemImageClick(item, ev);
            });
        });
    };
    /**
     * Handle Scroll event
     * */
    Timeline.prototype.handleScroll = function (ev) {
        this.lineRanger.collusionsMapper.hasCollusion = false;
        var found = null;
        for (var i = 0; i < this.$containerElement.items.length; i++) {
            var item = this.$containerElement.items[i];
            /*
             * canTriggerSlideContent
             * */
            if (this.canTriggerSlideContent(item))
                this.triggerSlideContent(item);
            if (found) {
                found--;
                if (found === 0)
                    break;
            }
            else if (this.lineRanger.itemIsInsideRange(item)) {
                this.lineRanger.collusionsMapper.hasCollusion = true;
                this.lineRanger.collusionsMapper.prev =
                    this.lineRanger.collusionsMapper.current;
                this.lineRanger.collusionsMapper.current = item;
                found = 20;
            }
        }
        if (!this.lineRanger.collusionsMapper.hasCollusion) {
            this.lineRanger.collusionsMapper.prev =
                this.lineRanger.collusionsMapper.current;
            this.lineRanger.collusionsMapper.current = null;
        }
        this.setItemClasses();
    };
    Timeline.prototype.handleItemImageClick = function (item, ev) {
        /*
         * Show Modal
         * */
        var doc = document.createDocumentFragment();
        var container = document.createElement("div");
        container.classList.add("image-slider-container");
        var closeBtn = document.createElement("div");
        closeBtn.classList.add('image-slider-container--close');
        closeBtn.innerHTML = '<a>X</a>';
        var img = document.createElement("img");
        img.src = ev.target.src;
        [closeBtn, img].forEach(function (el) { return container.append(el); });
        doc.append(container);
        document.body.append(doc);
        closeBtn.addEventListener('click', function () {
            return document.querySelectorAll(".image-slider-container")
                .forEach(function (el) { return el.remove(); });
        });
    };
    Timeline.prototype.canTriggerSlideContent = function (item) {
        return (item.isFirst && !item.isInView && this.lineRanger.itemIsInView(item, true));
    };
    Timeline.prototype.triggerSlideContent = function (item) {
        var _a, _b, _c, _d;
        return (_d = (_c = (_b = (_a = item
            .getParentElement()) === null || _a === void 0 ? void 0 : _a.parentElement) === null || _b === void 0 ? void 0 : _b.parentElement) === null || _c === void 0 ? void 0 : _c.querySelector(".contentContainer")) === null || _d === void 0 ? void 0 : _d.classList.add("visible");
    };
    // item methods
    Timeline.prototype.setItemClasses = function () {
        var _a = this.lineRanger.collusionsMapper, prev = _a.prev, current = _a.current;
        prev ? prev.setState(false) : null;
        current ? current.setState(true) : null;
    };
    /*
     * Hide elements on mobile view based on content height
     * */
    Timeline.prototype.setItemVisibility = function () {
        if (window.innerWidth < 690) {
            var $lastContainer_1;
            var sum_1 = 0;
            var maxHeight_1 = 0;
            this.$containerElement.items.map(function (item) {
                var _a, _b, _c, _d;
                if (item.isFirst) {
                    sum_1 = 0;
                    maxHeight_1 = 0;
                    var getHeight = function ($element) { return $element.clientHeight; };
                    var sumHeight = function (previousValue, currentValue) {
                        return +previousValue + +currentValue;
                    };
                    maxHeight_1 = (item.getSideBarElements().map(getHeight).reduce(sumHeight));
                    var parent_1 = (_b = (_a = item.getParentElement()) === null || _a === void 0 ? void 0 : _a.parentElement) === null || _b === void 0 ? void 0 : _b.parentElement;
                    $lastContainer_1 = parent_1;
                    console.log(maxHeight_1, item.getSideBarElements());
                }
                else {
                    var parent_2 = (_d = (_c = item.getParentElement()) === null || _c === void 0 ? void 0 : _c.parentElement) === null || _d === void 0 ? void 0 : _d.parentElement;
                    if (parent_2 === null || parent_2 === void 0 ? void 0 : parent_2.isEqualNode($lastContainer_1)) {
                        var $container = item.getParentElement();
                        sum_1 += item.element.clientHeight + 40;
                        if (sum_1 > maxHeight_1) {
                            $container.style.display = "none";
                            $container.visibility = 0;
                        }
                        else {
                            $container.style.display = "block";
                            $container.visibility = 1;
                        }
                    }
                }
            });
        }
        else {
            this.$containerElement.items.map(function (item) {
                var $container = item.getParentElement();
                $container.style.display = "block";
                $container.visibility = 1;
            });
        }
    };
    Timeline.prototype.setItemColor = function () {
        var red = 1;
        var green = 107;
        var blue = 183;
        var circleCounter = 0;
        var rowCounter = 0;
        var $parent;
        this.$containerElement.items.map(function (item) {
            $parent = item.getParentElement();
            if ($parent.visibility === 0)
                return;
            if (circleCounter % 9 == 0)
                rowCounter++;
            circleCounter++;
            switch (rowCounter) {
                case 9:
                    rowCounter = 1;
                    break;
                case 1:
                    red += 14.33;
                    green -= 7.55;
                    blue -= 11.44;
                    break;
                case 2:
                    red += 10.44;
                    green += 3.77;
                    blue -= 6.77;
                    break;
                case 3:
                    red += 2.88;
                    green += 13.11;
                    blue -= 2.11;
                    break;
                case 4:
                    red -= 10.11;
                    green += 0.33;
                    blue += 0.33;
                    break;
                case 5:
                    red -= 17.55;
                    green -= 7.22;
                    blue -= 0.33;
                    break;
                case 6:
                    red += 5.11;
                    green -= 3.77;
                    blue += 5.22;
                    break;
                case 7:
                    red += 4.77;
                    green += 13.55;
                    blue += 25.44;
                    break;
                case 8:
                    red -= 8.22;
                    green -= 13;
                    blue -= 9.33;
                    break;
                default:
            }
            var redRounded = parseInt(red);
            var greenRounded = parseInt(green);
            var blueRounded = parseInt(blue);
            item.element.style.backgroundColor =
                "rgb(" + redRounded + "," + greenRounded + "," + blueRounded + ")";
            if (item.isFirst) {
                item.getSideBarElements().forEach(function (contentItem) {
                    var heading = (contentItem.querySelector(".timeline-item-heading"));
                    if (heading) {
                        var headingArrowIcon = (heading.querySelector(".timeline-item-heading--arrow-end polygon"));
                        var headingBackIcon = (heading.querySelector(".arrow"));
                        [heading, headingArrowIcon, headingBackIcon].map(function ($el) {
                            $el.style.backgroundColor =
                                "rgb(" +
                                    redRounded +
                                    "," +
                                    greenRounded +
                                    "," +
                                    blueRounded +
                                    ")";
                            $el.style.fill =
                                "rgb(" +
                                    redRounded +
                                    "," +
                                    greenRounded +
                                    "," +
                                    blueRounded +
                                    ")";
                        });
                    }
                });
            }
        });
    };
    Timeline.itemSelector = ".bubble";
    return Timeline;
}());
/*-------------------------------------------------------------------------------*/
(function ( /* Auto Init */) { return document.querySelectorAll('div[data-timeline="true"]').forEach(function (el) { return new Timeline(el); }); })();
