import * as React from "react";
import * as ReactDOM from "react-dom";
import { changeColors } from "./utils/changeColors";
import { changeContributions } from "./utils/changeContributions";
import { getAll } from "./utils/api";
import { changeOverview } from "./utils/changeOverview";
import { changeActivity } from "./utils/changeActivity";
import Overview from "./components/atoms/Overview";

const createOrginElement = (id: string, component: any) => {
    const elem = document.createElement("div");
    elem.setAttribute("id", id);
    const main = document.querySelector("#custom-activity-overview");
    if (main) {
      main.appendChild(elem);
    }
  ReactDOM.render(component, document.getElementById(id));
};

chrome.runtime.onMessage.addListener(async function (
  msg,
  sender,
  sendResponse
) {
  try {
    if (msg) {
      const html = document.querySelector('html');
      const targetElements = document.querySelectorAll(
        ".ContributionCalendar-day"
      );

      let isDark = false;
      
      if(targetElements.length <= 0 && msg.type === 'init') {
        sendResponse({status: true});
      } else {
        sendResponse({ status: false });
      }

      if(msg.type !== 'init') {
        //contributionのUIを削除
        const contributionList = document.querySelector(".contribution-activity-listing");
        const ajaxList = document.querySelector(".ajax-pagination-form");
        if(contributionList && ajaxList) {
          (contributionList as HTMLElement).style.setProperty('display', 'none');
          (ajaxList as HTMLElement).style.setProperty('display', 'none');
        }
        document.querySelector(".svg-tip")?.classList.remove("svg-tip");
        const organizations = document.querySelector(".js-org-filter-links-container")
        if (organizations) {
          (organizations as HTMLElement).style.setProperty('display', 'none');
        }

        //dark mode
        const noValueElement = targetElements[targetElements.length - 5];
        const cssStyleDeclaration = getComputedStyle(noValueElement, null);
        const fillColor = cssStyleDeclaration.getPropertyValue("fill");
        

        // getメソッド
        const username = document
          .querySelector("[itemprop=additionalName]")
          ?.textContent?.trim();
        const data = await getAll(username);
        const contributions = changeColors(targetElements, data.trainings, msg.activity, fillColor);
        changeContributions(contributions, msg.activity);

        const floatRight = document.querySelectorAll(".js-calendar-graph .float-right");
        if(floatRight.length > 1) floatRight[floatRight.length - 1].remove();
        
        // Overviewの書き換え
        const overviewWrapper = document.querySelector("#user-activity-overview");
        if (overviewWrapper) { 
          const overviewData = changeOverview(overviewWrapper, data.trainings, msg.activity);
          createOrginElement(
            "activity-overview-detail",
            (
              <Overview 
                avg={overviewData.avg}
                mx={overviewData.mx}
                type={msg.activity}
              />
            )
          )
        }
        
        // Activityの書き換え
        const activityWrapper = document.querySelector(
          "#js-contribution-activity"
        );
        if (activityWrapper)
          changeActivity(activityWrapper, data.trainings, msg.activity);
      }
    } else {
      sendResponse("failed");
    }
  } catch (e) {
    console.error(e);
  }
});
