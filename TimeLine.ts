
/**
 * Detect collusion from a given range (TriggerProints)
 * */
class TimeLineCollusionRanger {
  static triggerPoint = {
    height: 90,
    top: (() => {
      return window.innerWidth < 690 ? 150 : 400;
    })(),
    drawRanger: false,
  };

  public collusionsMapper = {
    hasCollusion: false, // item is inside mapper
    current: <TimelineItem | null>null,  // current item inside mapper
    prev: <TimelineItem | null>null, // prev item inside mapper
  };

  constructor( ) {
    this.drawVisibleRanger();
  }

  protected drawVisibleRanger() {
    if (
        !TimeLineCollusionRanger.triggerPoint.drawRanger ||
        document.querySelector(".timeline-ranger-helper")
    )
      return;
    const $div = document.createElement("div");
    const points = TimeLineCollusionRanger.triggerPoint;
    $div.innerHTML = `<div style="opacity: 0.1;position: fixed;top: ${points.top}px;height: ${points.height}px;width: 100%;background: #ff2b2b" class="timeline-ranger-helper"></div>`;
    document.body.appendChild($div);
  }

  public hasCollusion(){
    return this.collusionsMapper.hasCollusion;
  }

  /**
   * Verify is item is inside range
   * @item <TimelineItem>
   * */
  itemIsInsideRange(item: TimelineItem) {
    const range = TimeLineCollusionRanger;

    const { top, height } = (<HTMLElement>(
        item.getParentElement()
    )).getBoundingClientRect();

    const isInsideTop =
        top > range.triggerPoint.top &&
        top < range.triggerPoint.top + range.triggerPoint.height;
    const isInsideBottom =
        top + height > range.triggerPoint.top &&
        top + height < range.triggerPoint.top + range.triggerPoint.height;

    if (isInsideTop || isInsideBottom) {
      return true;
    }
  }

  /**
   * Verify is item is inside browser viewport
   * @item <TimelineItem>
   * @setValue saves the value to the pased item
   * */
  itemIsInView(item: TimelineItem, setValue = true) {
    const { top, height } = (<HTMLElement>(
        item.getParentElement()
    )).getBoundingClientRect();

    if (setValue) {
      item.isInView = top < window.innerHeight && top + height >= 0;
      return item.isInView;
    } else {
      return top < window.innerHeight && top + height >= 0;
    }
  }
}
/*-------------------------------------------------------------------------------*/

class TimelineItem {
  /* Is the first child element from the container  */
  isFirst = false;

  /* Is betweeen window height and 0 */
  isInView = false;

  isActivated = true;

  state = false;

  constructor(private $item: HTMLElement) {
    this.initListeners();
    this.isFirst = !$item.parentElement?.previousElementSibling;
  }

  get element(): HTMLElement {
    return this.$item;
  }

  initListeners() {
    // animation
    this.$item.ontransitionend = (ev) => {
      this.isActivated = this.$item.classList.contains("active");
      if (!this.state && this.isActivated) {
        this.$item.classList.remove("active");
      }
    };

    // image
    const parent: any = this.getParentElement();
    const imgs = [
      ...parent.parentElement.parentElement.querySelectorAll(
          ".timeline-item-content--images img"
      ),
    ];
    imgs.map(($img) => {
      if (!$img.dataset.listener) {
        $img.dataset.listener = $img.addEventListener("click", (ev: any) =>
            this.ON.click.image(this, ev)
        );
      }
    });
  }

  getParentElement() {
    return this.$item.parentElement;
  }

  getSideBarElements(): HTMLElement[] {
    if (this.isFirst) {
      return [
        ...(<any>(
            this.getParentElement()?.parentElement?.parentElement?.querySelectorAll(
                ".timeline-item"
            )
        )),
      ];
    }
    return [];
  }

  setState(state: boolean) {
    this.state = state;
    if (state) {
      if (!this.$item.classList.contains("active"))
        this.$item.classList.add("active");
    } else {
      if (this.isActivated) {
        this.$item.classList.remove("active");
      }
    }
  }

  ON = {
    click: {
      image: (item: TimelineItem, ev: any): any => null,
    },
  };
}
/*-------------------------------------------------------------------------------*/

class Timeline {

  static itemSelector = ".bubble";

  protected lineRanger = new TimeLineCollusionRanger();

  constructor(protected $containerElement: any) {
    this.inti();
  }

  protected inti() {
    this.initContainer();

    this.initItems();

    this.initListeners();
  }

  private initContainer() {
    if (typeof (<any>this.$containerElement) === "string") {
      this.$containerElement = document.querySelector(
        <any>this.$containerElement
      );
    }

    if (!this.$containerElement)
      throw new Error("DomElementNotFound: Container not found");
  }

  /**
   * Initialise all Items with the class<TimelineItem>
   * */
  private initItems() {
    this.$containerElement.items = [
      ...this.$containerElement.querySelectorAll(Timeline.itemSelector),
    ].map((v) => new TimelineItem(v));

    this.setItemVisibility();

    this.setItemColor();
  }

  /**
   * Adding Dom Listeners
   * */
  protected initListeners() {
    /**Global*/
    document.addEventListener("scroll", (ev) => this.handleScroll(ev));
    window.addEventListener("resize", () => {
      this.setItemVisibility();
      this.setItemColor();
    });

    /*Item based*/
    this.$containerElement.items.forEach(
      (item: TimelineItem) =>
        (item.ON.click.image = (item: TimelineItem, ev: any) =>
          this.handleItemImageClick(item, ev))
    );
  }

  /**
   * Handle Scroll event
   * */
  protected handleScroll(ev: Event) {
    this.lineRanger.collusionsMapper.hasCollusion = false;
    let found = null;
    for (let i = 0; i < this.$containerElement.items.length; i++) {
      let item = this.$containerElement.items[i];

      /*
       * canTriggerSlideContent
       * */
      if (this.canTriggerSlideContent(item)) this.triggerSlideContent(item);

      if (found) {
        found--;
        if (found === 0) break;
      } else if (this.lineRanger.itemIsInsideRange(item)) {
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
  }

  protected handleItemImageClick(item: TimelineItem, ev: any) {

    /*
     * Show Modal
     * */
    const doc = document.createDocumentFragment();
    const container = document.createElement("div");
    container.classList.add("image-slider-container");

    const closeBtn = document.createElement("div");
    closeBtn.classList.add('image-slider-container--close')
    closeBtn.innerHTML = '<a>X</a>';

    const img = document.createElement("img");
    img.src = ev.target.src;

    [closeBtn, img].forEach((el) => container.append(el));

    doc.append(container);
    document.body.append(doc);

    closeBtn.addEventListener('click', ()=>
      document.querySelectorAll(".image-slider-container")
          .forEach(el => el.remove()));
  }

  protected canTriggerSlideContent(item: TimelineItem): boolean {
    return (
      item.isFirst && !item.isInView && this.lineRanger.itemIsInView(item, true)
    );
  }

  protected triggerSlideContent(item: TimelineItem): any {
    return item
      .getParentElement()
      ?.parentElement?.parentElement?.querySelector(".contentContainer")
      ?.classList.add("visible");
  }

  // item methods

  public setItemClasses() {
    const { prev, current } = this.lineRanger.collusionsMapper;
    prev ? prev.setState(false) : null;
    current ? current.setState(true) : null;
  }

  /*
   * Hide elements on mobile view based on content height
   * */
  public setItemVisibility() {
    if (window.innerWidth < 690) {
      let $lastContainer: HTMLElement;
      let sum = 0;
      let maxHeight = 0;
      this.$containerElement.items.map((item: TimelineItem) => {
        if (item.isFirst) {
          sum = 0;
          maxHeight = 0;

          const getHeight = ($element: HTMLElement) => $element.clientHeight;

          const sumHeight = (previousValue: any, currentValue: any) =>
            <any>+previousValue + +currentValue;

          maxHeight = <any>(
            item.getSideBarElements().map(getHeight).reduce(sumHeight)
          );

          const parent = item.getParentElement()?.parentElement?.parentElement;
          $lastContainer = <any>parent;

          console.log(maxHeight, item.getSideBarElements());
        } else {
          const parent = item.getParentElement()?.parentElement?.parentElement;
          if (parent?.isEqualNode($lastContainer)) {
            let $container = <any>item.getParentElement();
            sum += item.element.clientHeight + 40;

            if (sum > maxHeight) {
              $container.style.display = "none";
              $container.visibility = 0;
            } else {
              $container.style.display = "block";
              $container.visibility = 1;
            }
          }
        }
      });
    } else {
      this.$containerElement.items.map((item: TimelineItem) => {
        let $container = <any>item.getParentElement();
        $container.style.display = "block";
        $container.visibility = 1;
      });
    }
  }

  public setItemColor() {
    var red = 1;
    var green = 107;
    var blue = 183;
    var circleCounter = 0;
    var rowCounter = 0;
    let $parent: any;
    this.$containerElement.items.map((item: TimelineItem) => {
      $parent = item.getParentElement();
      if ($parent.visibility === 0) return;

      if (circleCounter % 9 == 0) rowCounter++;

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

      let redRounded = parseInt(<any>red);
      let greenRounded = parseInt(<any>green);
      let blueRounded = parseInt(<any>blue);

      item.element.style.backgroundColor =
        "rgb(" + redRounded + "," + greenRounded + "," + blueRounded + ")";

      if (item.isFirst) {
        item.getSideBarElements().forEach((contentItem) => {
          const heading: HTMLElement = <any>(
            contentItem.querySelector(".timeline-item-heading")
          );

          if (heading) {
            const headingArrowIcon: HTMLElement = <any>(
              heading.querySelector(".timeline-item-heading--arrow-end polygon")
            );
            const headingBackIcon: HTMLElement = <any>(
              heading.querySelector(".arrow")
            );

            [heading, headingArrowIcon, headingBackIcon].map(($el) => {
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
  }
}
/*-------------------------------------------------------------------------------*/

((/* Auto Init */) => document.querySelectorAll('div[data-timeline="true"]').forEach((el) => new Timeline(el)))();
