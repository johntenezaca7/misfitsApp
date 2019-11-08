enum CoreEnum {
  Products = ".init-data-grid__item", 
  ContentType = "Content-Type",
  CustomerToken = "721028102",
  BackToList = "back-to-list"
};

interface CoreConfig {
  speed: number;
  url: string;
  spinner: HTMLElement;
  container: HTMLElement;
};

const showIcon = (item):string => {
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

export { CoreEnum, CoreConfig, showIcon };