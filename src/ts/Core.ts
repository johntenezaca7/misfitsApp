import { CoreConfig, CoreEnum, showIcon } from "./Core.info";
import { Observable, Subscription, of, fromEvent } from "rxjs";
import { catchError, switchMap, delay, tap } from "rxjs/operators";
import { ajax } from "rxjs/ajax";

class Core {
  private loadSpinner: HTMLElement;
  private container: HTMLElement;
  private backToList: HTMLElement;
  private products: NodeList;

  private speed: number;
  private requestUrl: string;
  private loaderView: string;
  private successView: string;
  private ajaxErrorView: string;
  private soldOutView: string;

  private $initDisplay: Observable<Subscription>;
  private $loadInitData: Observable<Subscription>;
  private $selectItems: Observable<Subscription>

  constructor(config: CoreConfig) {

    this.loadSpinner = config && config.spinner;
    this.container = config && config.container;
    this.requestUrl = config && config.url;
    this.speed = config && config.speed || 2000;

    this.initViews();

    this.initObs();

    this.init();
  };

  // Initalize display
  init(): void {
    this.$initDisplay.subscribe();
  };

  // Initialize Observables
  initObs(): void {
    // Wait 2 secs, remove spinner and render data from API call
    this.$initDisplay = of(null).pipe(
      delay(this.speed),
      tap(() => this.loadSpinner.style.display = "none"),
      switchMap(() => this.$loadInitData)
    );

    // Render data from API call and set up postReq Observable
    this.$loadInitData = ajax.getJSON(this.requestUrl).pipe(
      tap(res => this.displayInitData(res, showIcon)),
      tap(() => this.setProductObs()),
      switchMap(() => this.$selectItems),
      catchError(error => {
        this.displayAjaxError();
        return of(error);
      })
    );
  };

  // Subscribe to listen for clicks, load spinner and pass event to post req method
  setProductObs(): void {
    this.$selectItems = fromEvent(this.products, "click").pipe(
      tap(() => this.container.innerHTML = this.loaderView),
      delay(this.speed),
      switchMap((event) => {
        return this.productSelectReq(event);
      })
    );
  }

  // Setup views
  initViews(): void {
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
  }

  // Send post req with custom header and display success!
  productSelectReq(ev: Event): Observable<Subscription> {
    const id = ev.target['id'] ? ev.target['id'] : ev.target['parentElement']['id'];

    return ajax({
      url: `${this.requestUrl}/${id}`,
      method: 'POST',
      headers: {
        "Content-Type": CoreEnum.ContentType,
        "X-Customer-Token": CoreEnum.CustomerToken
      },
    }).pipe(
      tap(() => this.container.innerHTML = this.successView),
      tap(() => this.backToList = document.getElementById(CoreEnum.BackToList)),
      switchMap(() => this.backToListObs(this.backToList)),
      catchError(error => {
        this.displayAjaxError();
        return of(error);
      })
    );

  };

  // Render data from get request or render sold out view
  displayInitData(res: any, iconFunc: Function): void {
    const { items } = res.data;

    const renderData = `
      <div class="init-data-grid">
        <h3 class="init-data-grid__title">Select an item!</h3>
        <div class="init-data-grid__items">
        ${items.map((item: any) => {
            const { id, product, price } = item;

            return `
              <div class="init-data-grid__item" id=${ id}>
                <h3 class="init-data-grid__item-name">${ product}</h3>
                ${ iconFunc(item) }
                <p class="init-data-grid__item-price">$${ price}</p>
              </div>`
        }).join('')}
        </div>
      </div>`;
    
    // Check if there is data to be used else render sold out view.
    items.length > 0 ? 
      this.container.innerHTML = renderData :
      this.container.innerHTML = this.soldOutView;

    // Listen for clicks on the product items
    this.products = document.querySelectorAll(CoreEnum.Products);
  };

  // Render ajax error view
  displayAjaxError(): void {
    this.container.innerHTML = this.ajaxErrorView;
  };

  // On click, display inital data again
  backToListObs(elm: HTMLElement): Observable<Subscription> {
    return fromEvent(elm, "click").pipe(
      switchMap(() => this.$loadInitData)
    );
  };
};

export { Core };