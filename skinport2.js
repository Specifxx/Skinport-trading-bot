

let itemsAddedToCartCount = 0; // Track the number of items added to the cart

function sendDiscordNotification() {
  const discordWebhookUrl = 'https://discord.com/api/webhooks/1148800514729984000/x-Fr1gTdbJHtCT52OI5mcMXb9XGzcEMypheKZVYMYzOL4ppICrFXvX5TLT6KmlZNnr24';

  // Construct the payload for the Discord webhook
  const payload = {
    content: 'New item added to the cart!', // Message content
  };

  // Send a POST request to the Discord webhook URL
  fetch(discordWebhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
    .then((response) => {
      if (!response.ok) {
        console.error('Failed to send Discord notification:', response.statusText);
      }
    })
    .catch((error) => {
      console.error('Error sending Discord notification:', error);
    });
}

function checkAndAddToCart() {
  iteration++;
  console.log("iteration %s", iteration)
  const items = document.querySelectorAll('.ItemPreview-content');
  let total = 0;
  // Limit the iteration to the first 15 items
  for (let index = 0; index < 10 && index < items.length; index++) {
    const item = items[index];
    const discountElement = item.querySelector('.ItemPreview-discount span');
    const priceElement = item.querySelector('.ItemPreview-priceValue div.Tooltip-link');
    if (discountElement && priceElement) {
      const discountText = discountElement.innerText;
      const discountPercentage = parseFloat(discountText.replace('− ', '').replace('%', ''));

      const priceText = priceElement.innerText;
      const price = parseFloat(priceText.replace('AU$', ''));

      if ((discountPercentage > 24 && price > 3.6 && price < 100)) {
        total = total + price;
        if (total < 3.6) {
          continue;
        }
        console.log("yes")
        const addToCartButton = item.querySelector('.ItemPreview-mainAction');
        if (addToCartButton) {
          addToCartButton.click();
          itemsAddedToCartCount++; // Increment the count of items added to the cart
          sendDiscordNotification(); // Play the notification sound

          if (itemsAddedToCartCount == 1) {
            // If 3 items have been added to the cart, initiate the checkout
            navigateToCartPage();
            return; // Exit the function
          }
        }
      } 
      
    }
    
  }
  if (itemsAddedToCartCount >= 1) {
    // If 3 items have been added to the cart, initiate the checkout
    navigateToCartPage();
    return; // Exit the function
  }

  observeNewItems()
}

// Rest of the script remains the same...


async function navigateToCartPage() {
  const cartUrl = 'https://skinport.com/cart';

  // Use the History API to change the URL without reloading the page
  window.history.pushState({ path: cartUrl }, '', cartUrl);

  // Trigger a popstate event to ensure that the URL change is recognized by the browser
  const popStateEvent = new PopStateEvent('popstate', { state: { path: cartUrl } });
  dispatchEvent(popStateEvent);
  await waitForElementVisibility('input[id^="cb-"]'); // Wait for viewCartButton to become visible
  checkCheckboxesStartingWithCB();
}

async function checkCheckboxesStartingWithCB() {
  await sleep(50)
  const checkboxes = document.querySelectorAll('input[id^="cb-"]');
  for (const checkbox of checkboxes) {
    checkbox.click();
  }
  await waitForElementVisibility('.SubmitButton.CartSummary-checkoutBtn'); // Wait for proceedToCheckoutButton to become visible
  console.log("clicking checkboxes")
  clickProceedToCheckoutButton();
}

async function clickProceedToCheckoutButton() {
  const proceedToCheckoutButton = document.querySelector('.SubmitButton.CartSummary-checkoutBtn');
  if (proceedToCheckoutButton) {
    proceedToCheckoutButton.click();
    await waitForElementVisibility('.adyen-checkout__payment-method__name'); // Wait for payment method buttons to become visible
    console.log("proceeding to checkout")
    await selectPaymentMethod();
  }
}

async function selectPaymentMethod() {
  const paymentMethods = document.querySelectorAll('.adyen-checkout__payment-method__name');
  for (const method of paymentMethods) {
    if (method.innerText === 'AliPay') {
      method.click();

      // After selecting the payment method, click "Continue to AliPay"
      await waitForElementVisibility('.adyen-checkout__button__text')
      console.log("selecting payment")
      clickContinueToAliPayButton(); // Wait for 1 second before clicking
      break; // Exit the loop after clicking AliPay
    }
  }
}

async function clickContinueToAliPayButton() {
  await sleep(70)
  const buttons = document.querySelectorAll('.adyen-checkout__button__text');
  for (const button of buttons) {
    if (button.textContent === 'Continue to AliPay') {
      console.log("going to alipay")
      button.closest('button').click();
      break;
    }
  }
}

async function waitForElementVisibility(selector, maxAttempts = 10000, interval = 100) {
  let attempts = 0;

  return new Promise((resolve, reject) => {
    const checkVisibility = () => {
      const element = document.querySelector(selector);

      if (element && element.offsetParent !== null) {
        resolve();
      } else {
        attempts++;

        if (attempts >= maxAttempts) {
          reject(new Error(`Element with selector "${selector}" not visible after waiting.`));
        } else {
          setTimeout(checkVisibility, interval);
        }
      }
    };

    checkVisibility();
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
// Function to create a MutationObserver
function observeNewItems() {
  const targetNode = document.querySelector('.CatalogPage-content'); // Select the specific container where new items appear

  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        // New items (child elements) have been added to the CatalogPage-content div, handle them here
        
        observer.disconnect(); // Disconnect the observer after the first mutation
        checkAndAddToCart(); // Call your function to check and add items
        break;
      }
    }
  });

  // Configure and start the observer
  const config = { childList: true, subtree: true };
  observer.observe(targetNode, config);
}
let iteration = 0;
const liveButton = document.querySelector('.LiveBtn');
if (liveButton) {
  liveButton.click();
}
observeNewItems()

// You can manually stop the script by running stopChecking() in the console.