import { Core } from "./Core";
import { CoreConfig } from "./Core.info";

const Config: CoreConfig = {
  speed: 500,
  url: "https://applicant-dev.misfitsmarket.com/api/test/v1",
  spinner: document.getElementById("spinner"),
  container: document.getElementById("main-container")
};

const initCore = new Core(Config);