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
      args: ["--start-maximized"],
    };

    const browser = await puppeteer.launch(launchOptions);
    page = await browser.newPage();
    await page.goto("https://checkin.timewatch.co.il/punch/punch.php", {
      waitUntil: "networkidle2",
    });

    await login(COMPANY_NUMBER, EMPLOYEE_NUMBER, PASSWORD);
    await gotToReports();
    await selectMonthIfNeeded();
    await fillMissing();

    await browser.close();
  }

  async function login(companyNumber, employeeNumber, password) {
    await page.type("#compKeyboard", companyNumber, { delay: 20 });
    await page.type("#nameKeyboard", employeeNumber, { delay: 20 });
    await page.type("#pwKeyboard", password, { delay: 20 });
    await page.click('[src="/images/entrance.jpg"]');
    await page.waitFor(2000);
  }

  async function selectMonthIfNeeded() {
    const dayOfMonth = new Date().getDate();
    if (dayOfMonth > 24) {
      const currentMonth = new Date().getMonth() + 1;
      await page.click(
        `[name="cpick"] [name="month"] option[value="${currentMonth - 1}"]`
      );
      await page.click('a[href*="watch_report"]');
    }
  }

  async function gotToReports() {
    await page.click('[href*="editwh.php"]');
    await page.waitFor(2000);
  }

  async function fillMissing() {
    const daysLinks = await getAllDaysToUpdate();

    for (const dayLink of daysLinks) {
      await page.goto("https://checkin.timewatch.co.il/punch/" + dayLink, {
        waitUntil: "networkidle2",
      });
      const startHour = await page.evaluate(
        () => document.querySelector("#ehh0").value
      );
      if (!startHour) {
        await page.type("#ehh0", "09", { delay: 20 });
        await page.type("#emm0", getMinutes(), { delay: 20 });
      }

      const endHour = await page.evaluate(
        () => document.querySelector("#xhh0").value
      );
      if (!endHour) {
        await page.type("#xhh0", "18", { delay: 20 });
        await page.type("#xmm0", getMinutes(), { delay: 20 });
      }
      await page.waitFor(2000);
      await page.click('[src="/images/update.jpg"]');
      await page.waitFor(2000);
    }
    /*
        cy.get('tr[onclick*="openInnewWindow"]').each((day) => {
            const dayElm = day[0];
            if (
                !dayElm.innerHTML.includes('שבת') &&
                !dayElm.innerHTML.includes('שישי')
            ) {
                const onclickText = day[0].getAttribute('onclick');
                const href = onclickText.match(
                    /(?<=javascript:openInnewWindow\(').*?(?=')/
                )[0];
                cy.visit('https://checkin.timewatch.co.il/punch/' + href);
                cy.get('#ehh0').then((inputFromHour) => {
                    if (inputFromHour && !inputFromHour[0].value) {
                        cy.get('#ehh0').type('09');
                        const minutes = getMinutes();
                        cy.get('#emm0').type(minutes);
                    }
                });

                cy.get('#xhh0').then((inputToHour) => {
                    if (inputToHour && !inputToHour[0].value) {
                        cy.get('#xhh0').type('18');
                        const minutes = getMinutes();
                        cy.get('#xmm0').type(minutes);
                    }
                });

                cy.wait(1000);
                cy.get('[src="/images/update.jpg"]').click();
                cy.wait(1000);
            }
        });
        return cy.wait(2000);

        */
  }

  async function getAllDaysToUpdate() {
    return await page.evaluate(() => {
      const trs = Array.from(
        document.querySelectorAll('tr[onclick*="openInnewWindow"]')
      );
      const output = [];
      trs.map((day) => {
        if (!day.innerHTML.includes("שבת") && !day.innerHTML.includes("שישי")) {
          const onclickText = day.getAttribute("onclick");
          const href = onclickText.match(
            /(?<=javascript:openInnewWindow\(').*?(?=')/
          )[0];
          output.push(href);
        }
      });
      return output;
    });
  }

  function getMinutes() {
    const minute = parseInt(((Math.random() * 100) % 59) + 1);
    return minute < 10 ? `0${minute}` : minute + "";
  }
})();
