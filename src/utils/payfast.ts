import { Alert, Linking } from "react-native";

type PayFastParams = {
  amount: number;
  orderId: string;
};

export const startPayFastPayment = async ({
  amount,
  orderId,
}: PayFastParams) => {
  try {
    const merchantId = "10000100"; // sandbox
    const merchantKey = "46f0cd694581a"; // sandbox
    const returnUrl = "https://example.com/success";
    const cancelUrl = "https://example.com/cancel";
    const notifyUrl = "https://example.com/notify";

    const url =
      `https://sandbox.payfast.co.za/eng/process?merchant_id=${merchantId}` +
      `&merchant_key=${merchantKey}` +
      `&amount=${amount.toFixed(2)}` +
      `&item_name=Order_${orderId}` +
      `&return_url=${returnUrl}` +
      `&cancel_url=${cancelUrl}` +
      `&notify_url=${notifyUrl}`;

    await Linking.openURL(url);
  } catch (error) {
    Alert.alert("Payment Error", "Could not start PayFast payment.");
  }
};
