import { Core, CoreConfig } from "./Core";

const Spinner = document.getElementById("spinner");
const MainContainer = document.getElementById("main-container");

const Config: CoreConfig = {
  removeSpinnerSpeed: 2000,
  requestUrl :"https://applicant-dev.misfitsmarket.com/api/test/v1"
};

const initCore = new Core(MainContainer, Spinner, Config);