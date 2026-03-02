# Unique Creations by Lisa C. Website

[![Netlify Status](https://api.netlify.com/api/v1/badges/35d10f2b-c3c1-46c1-89ee-754acc6dfc76/deploy-status)](https://app.netlify.com/projects/willowy-jelly-c76339/deploys)

This is the custom storefront for [Unique Creations by Lisa C.](https://uniquecreationsbylisac.com), designed to replace the standard Square Online template with a bespoke, artisan aesthetic.

## 🛠 Project Structure

* **`index.html`**: The main website file containing all HTML, CSS (via Tailwind), and JavaScript logic.

* **Assets**: Images are currently sourced from Unsplash (placeholders). Replace these with actual product photos in the `products` array within `index.html`.

## 🚀 Deployment (Netlify)

This site is designed to be hosted statically on Netlify.

1. Connect this GitHub repository to Netlify.

2. Set the **Publish directory** to `/` (root).

3. Netlify will automatically deploy the `index.html`.

## 💳 Square Integration Strategy

This site uses a "Headless" approach to save on monthly hosting fees:

1. **Frontend**: Hosted free on Netlify.

2. **Backend/Payments**: Handled by Square.

3. **Checkout Logic**:

   * *Current State*: Mock checkout function (shows alert).

   * *Production State*: Replace the `checkout()` function in `index.html` to redirect users to **Square Checkout Links** or use the **Square Web Payments SDK**.

## 🎨 Customization

* **Colors**: Defined in the `tailwind.config` script in the `<head>`.

* **Products**: Edited directly in the `products` JavaScript array at the bottom of `index.html`.
