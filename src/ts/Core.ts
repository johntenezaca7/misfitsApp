import { Observable, Subscription, of, fromEvent }  from "rxjs";
import { map, catchError, switchMap, delay } from "rxjs/operators";
import { ajax } from "rxjs/ajax";

export enum CoreEnum {
  Products = ".init-data-grid__item", 
  ContentType = "Content-Type",
  CustomerToken = "721028102",
  BackToList = "back-to-list"
};

export interface CoreConfig {
  removeSpinnerSpeed?: number;
  requestUrl?: string;
};

class Core {
  private loadSpinner: HTMLElement;
  private container: HTMLElement;
  private backToList: HTMLElement;
  private products: NodeList;

  private removeSpinnerSpeed: number;
  private requestUrl: string;
  private loaderView: string;
  private successView: string;
  private ajaxErrorView: string;
  private soldOutView: string;

  private $initDisplay: Observable<Subscription>;
  private $loadInitData: Observable<Subscription>;
  private $selectItems: Observable<Event>  

  constructor(container:HTMLElement, spinner:HTMLElement, config: CoreConfig) {

    this.removeSpinnerSpeed = config && config.removeSpinnerSpeed || 5000;
    this.requestUrl = config && config.requestUrl;

    this.loadSpinner = spinner;
    this.container = container;

    // Setup views
    this.loaderView = `
      <div class="main__spinner" id="spinner">
        <div class="lds-facebook">
          <div></div>
          <div></div>
          <div></div>
        </div>
        <h3 class="loading">Processing...</h3>
      </div>`;

    this.successView = `
      <div class="loading loading--success">
        <h3>Success!</h3>
        <p id="back-to-list">&#8678; Back to list.</p>
      </div>`;

    this.ajaxErrorView = `<div class="error"><h3>Server Error. Please try again!</h3></div>`;

    this.soldOutView = `<div class="error"><h3>Sold out!</h3></div>`;

    this.initObs(this.removeSpinnerSpeed, this.requestUrl);
    
    this.init();
  };

  // Initalize display
  init(): void {
    this.$initDisplay.subscribe();
  };

  // Initialize Observables
  initObs(speed:number, url: string): void {
    // Wait 2 secs, remove spinner and render data from API call
    this.$initDisplay = Observable.create( 
      subscriber => {
        subscriber.next();
        subscriber.complete();
      }
    ).pipe(
      delay(speed),
      map(() => this.loadSpinner.style.display = "none"),
      switchMap(() => this.$loadInitData),
    );

    // Render data from API call and set up postReq Observable
    this.$loadInitData = ajax.getJSON(url).pipe(
      map(res => {
        this.displayInitData(res, this.showIcon)

        // Listen for clicks on the product items
        this.products = document.querySelectorAll(CoreEnum.Products);
        this.$selectItems = fromEvent(this.products, "click");

        // Subscribe to listen for clicks, load spinner and pass event to post req method
        this.$selectItems.pipe(
          map((event) => {
            this.container.innerHTML = this.loaderView;
            return event;
          }),
          delay(speed),
          switchMap((event) => {
            return this.productSelectReq(event, url);
          })
        ).subscribe();
      }),
      catchError(error => {
        this.displayAjaxError();
        return of(error);
      })
    );
  };

  // Send post req with custom header and display success!
  productSelectReq(ev:Event, url: string): Observable<Subscription> {
    const id = ev.target['id'] ? ev.target['id'] : ev.target['parentElement']['id'];
    if (id) {
      return ajax({
        url: `${url}/${id}`,
        method: 'POST',
        headers: {
          "Content-Type": CoreEnum.ContentType,
          "X-Customer-Token": CoreEnum.CustomerToken
        },
      }).pipe(
        map(response => this.selectOptionSuccess(response)),
        catchError(error => {
          this.displayAjaxError();
          return of(error);
        })
      );
    };
  };

  // Render data from get request or render sold out view
  displayInitData(res:any, iconFunc: Function): void {
    const { items } = res.data;

    const renderData = `
      <div class="init-data-grid">
        <h3 class="init-data-grid__title">Select an item!</h3>
        <div class="init-data-grid__items">
        ${  items.map(item => {
              const { id, product, price } = item;
              return `
                <div class="init-data-grid__item" id=${ id }>
                  <h3 class="init-data-grid__item-name">${ product }</h3>
                  ${ iconFunc(item) }
                  <p class="init-data-grid__item-price">$${ price }</p>
                </div>`
            }).join('')
        }
        </div>
      </div>`;
    
    if ( items.length > 0 ) {
      this.container.innerHTML = renderData;
    } else {
      this.container.innerHTML = this.soldOutView;
    };
  };

  // Display Icons
  showIcon(item):string {
    switch(item.product) {
      case "Eggs":
        return `<i class="fas fa-egg"></i>`;
        break;
      case 'Milk':
        return `<i class="fas fa-glass-whiskey"></i>`;
        break;
      case "Bread":
        return `<i class="fas fa-bread-slice"></i>`
        break;
      case "Apples":
        return `<i class="fab fa-apple"></i>`;
      default:
        return `<i class="fas fa-utensils"></i>`;
    };
  };

  // Render ajax error view
  displayAjaxError(): void {
    this.container.innerHTML = this.ajaxErrorView;
  };

  // Render success message and add a link back to select more options
  selectOptionSuccess(obj:object): void {
    if (obj["response"] && obj["status"] === 200) {
      
      this.container.innerHTML = this.successView;
      this.backToList = document.getElementById(CoreEnum.BackToList);

      this.backToListObs(this.backToList).subscribe();
    };
  };

  // On click, display inital data again
  backToListObs(elm:HTMLElement): Observable<Subscription> {
    return fromEvent(elm, "click").pipe(
      switchMap(() => this.$loadInitData)
    );
  };
};

export { Core };