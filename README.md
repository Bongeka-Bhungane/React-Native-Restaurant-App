<img src="https://socialify.git.ci/Bongeka-Bhungane/React-Native-Restaurant-App/image?description=1&font=Raleway&language=1&name=1&owner=1&pattern=Circuit+Board&theme=Light" alt="React-Native-Restaurant-App" width="640" height="320" />

# The Cozy Cup – React Native Restaurant App

* The Cozy Cup is a mobile restaurant ordering application built with React Native and Firebase.
The app allows customers to browse menu items, place orders, make secure payments, and track order status in real time.
* An admin dashboard is included for managing orders, users, and system statistics.

# Features
## Customer Features

* Browse food and beverage menu

* Add items to cart

* Customize items (extras, sides, temperature options)

* Secure payment using Paystack

* Choose Delivery or Pickup

* Track order progress

* View order history

* Update profile details

## Admin Features

* Dashboard with system statistics

* View total revenue and daily revenue

* Track order status distribution

* View top selling items

* Manage customer orders

* Update order status (Preparing → Delivering → Delivered)

* View users (customers and admins)

* Add new admin users

* Update admin profile

# Admin Dashboard

### The admin dashboard provides key business insights including:

* Total orders

* Daily orders

* Total revenue

* Revenue for the current day

* Order status breakdown

* Top selling menu items

### *These metrics are calculated dynamically from Firebase Firestore.

# Payments

* Payments are processed using Paystack.

### Payment flow:

* Customer selects items

* Proceeds to checkout

* Paystack payment popup opens

### After successful payment:

* Order is saved in Firestore

* Order status is set to Preparing

* Admin receives the order in the dashboard

# Tech Stack
## Frontend

* React Native

* Expo

* TypeScript

## Backend

* Firebase Authentication

* Firebase Firestore

* Firebase Storage

## Payment

* Paystack

## Charts

* react-native-chart-kit

# Firebase Collections
## users

* Stores all user profiles.

### Fields:

uid
name
surname
email
contactNumber
role (admin | user)
isActive
createdAt
updatedAt

## orders

* Stores customer orders.

### Fields:

orderId
userId
items[]
totalAmount
status
paymentStatus
paymentProvider
address
orderType (pickup | delivery)
createdAt
updatedAt

## menuItems

* Stores restaurant menu items.

### Fields:

name
description
price
category
image
isAvailable
extras[]
sides[]

# Installation

### Install APK file:

```
https://expo.dev/accounts/bongeka/projects/cozy-cup/builds/2addca77-0b97-44cb-b919-96e0c50050bc
```

### Clone the repository:

```
git clone https://github.com/yourusername/cozy-cup-app.git
``` 

### Install dependencies:
```
npm install
```
### Start the development server:
```
npx expo start
```
# Environment Setup

## Create a Firebase project and configure:

* Firebase Authentication

* Firestore Database

* Firebase Storage

### Then update:

* src/config/firebase.ts

* with your Firebase configuration.

# Admin Access

### Admin login credintials:
* email
```
thando@thecozycup.com
```
* password
  ```
  admin12345
  ```

* Admins can be added through the Admin Add Admin page.

# Screens

## Customer Screens:

* Login / Register

* Home (Menu)

* Cart

* Checkout

* Profile

* Order Tracking

## Admin Screens:

* Dashboard

* Orders Management

* Users Management

* Add Admin

* Admin Profile

# Order Status Flow

### Delivery Orders

```
Preparing → Delivering → Delivered
```

Pickup Orders

``` 
Preparing → Ready for Pickup → Picked Up
```

# Future Improvements

* Push notifications for order updates

* Admin analytics dashboard

* Live driver tracking

* Coupon and discount system

* Multiple restaurant branches

* Image uploads for menu items

# Author

## Developed by:

Bongeka Bhungane
