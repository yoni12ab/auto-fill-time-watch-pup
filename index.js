#!/usr/bin/env node
const puppeteer = require("puppeteer-core");
const chromePaths = require("chrome-paths");
(async () => {
  console.log("process ", process.argv);
  const [, , COMPANY_NUMBER, EMPLOYEE_NUMBER, PASSWORD] = process.argv;
  let page;
  console.log("COMPANY_NUMBER " + COMPANY_NUMBER);
  if (!COMPANY_NUMBER) {
    throw new Error(
      "please set password and employee number and company number in cypress json"
    );
  }

  await main();
  return;

  async function main() {
    const launchOptions = {
      headless: false,
      executablePath: chromePaths.chrome, // '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // because we are using puppeteer-core so we must define this option
      args: [`--window-size=1920,1080`],
      defaultViewport: {
        width: 1920,
        height: 1080,
      },
    };

    const browser = await puppeteer.launch(launchOptions);
    page = await browser.newPage();

    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });
    await page.goto("https://checkin.timewatch.co.il/punch/punch.php", {
      waitUntil: "networkidle2",
    });

    await login(COMPANY_NUMBER, EMPLOYEE_NUMBER, PASSWORD);
    await gotToReports();
    await selectMonthIfNeeded();
    await page.waitFor(3000);
    await fillMissing();

    await browser.close();
  }

  async function login(companyNumber, employeeNumber, password) {
    await page.type("#login-comp-input", companyNumber, { delay: 20 });
    await page.type("#login-name-input", employeeNumber, { delay: 20 });
    await page.type("#login-pw-input", password, { delay: 20 });
    await page.click(".btn-lg");
    await page.waitFor(2000);
  }

  async function selectMonthIfNeeded() {
    const currentMonth = (new Date().getMonth() + 1).toString();
    const selectedMonth = await page.$('[name="month"] option[selected]');


    if (
      selectedMonth &&
      currentMonth !== (await selectedMonth?.[0]?.value)
    ) {
      //await page.select('[name="month"]', currentMonth);
      await page.evaluate((currentMonth) => {
        document.querySelector('[name="month"]').value = currentMonth;
      },currentMonth );

    }
  }

  async function gotToReports() {
    await page.waitForSelector(".edit-info a");
    await page.click(".edit-info a");
    await page.waitFor(2000);
  }

  async function fillMissing() {
    const tableRowsSelectors = await getAllDaysSelectorsToUpdate();
    for (let i = 0; i < tableRowsSelectors.length; i++) {
      await selectMonthIfNeeded();
      const currentRow = await page.$(tableRowsSelectors[i]);
      const dayDescription = await (
        await currentRow.getProperty("innerText")
      ).jsonValue();
      if (dayDescription.includes("חסרה")) {
        console.log(dayDescription);
        await currentRow.click();
        await fillHours();
      }
    }
  }

  async function fillHours() {
    await page.waitForSelector("#ehh0");
    await page.evaluate(() => {
      const getMinutes = () => {
        const minute = parseInt(((Math.random() * 100) % 59) + 1);
        return minute < 10 ? `0${minute}` : minute + "";
      };
      document.querySelector("#ehh0").value = "09";
      document.querySelector("#emm0").value = getMinutes();
      document.querySelector("#xhh0").value = "18";
      document.querySelector("#xmm0").value = getMinutes();
    });
    await page.waitFor(1000);
    await page.click(".modal-popup-footer .modal-popup-btn-confirm");
    await page.waitFor(2000);
  }

  async function getAllDaysSelectorsToUpdate() {
    return await page.evaluate(() => {
      return [
        ...document.querySelectorAll('.table-responsive tr[class*="type"]'),
      ]
        .filter((tr) => tr.innerText.includes("חסרה"))
        .map((tr) => `[onclick="${tr.getAttribute("onclick")}"]`);
    });
  }
})();
