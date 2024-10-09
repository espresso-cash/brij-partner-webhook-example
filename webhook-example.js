import { XFlowPartnerClient } from "xflow-partner-client";
import nacl from "tweetnacl";
import base58 from "bs58";

export async function webhookHandler(body) {
  console.log("--- Webhook Example Usage ---");

  try {
    // 0. If you don't have a seed, generate one and save it
    // const generatedKeyPair = await XFlowPartnerClient.generateKeyPair();
    // console.log(generatedKeyPair);
    // generateKeyPair.seed

    // {
    // publicKey: 'F2etcaJ1HbPVjjKfp4WaZFF1DoQRNUETkXyM1b98u76C',
    // privateKey: '5bwHc91NsKeVNS6JrYdKPNCKbdLekTZ6cVJaCDhAhwQcrgFFkyfShVjNFXzJSMDBoiKsawVx4CCjWELcKxQhKAVA',
    // secretKey: '5bwHc91NsKeVNS6JrYdKPNCKbdLekTZ6cVJaCDhAhwQcrgFFkyfShVjNFXzJSMDBoiKsawVx4CCjWELcKxQhKAVA',
    // seed: ,
    // getPublicKeyBytes: [AsyncFunction: getPublicKeyBytes],
    // getPrivateKeyBytes: [AsyncFunction: getPrivateKeyBytes]
    // }

    const seed = "GVb2FXnG64Xpr6KbWP6Jp4hXWSkWU4uL9AgBTsdBjnZp";

    // 1. Initialize partner client with your auth key pair
    const client = await XFlowPartnerClient.fromSeed(seed);

    console.log("--- Body ---");

    const orderId = body.orderId;
    const order = await client.getOrder(orderId);

    const userPK = order.userPublicKey;

    console.log(order);

    // 2. Get user secret key
    const secretKey = await client.getUserSecretKey(userPK);

    // 3. Get KYC result
    const kycValidationResult = await client.getValidationResult({
      key: "kycSmileId",
      secretKey: secretKey,
      userPK: userPK,
    });

    // KYC should return JSON result of validation. Ie: for Nigeria, it is SmileID result
    // You can do more validation of user here
    if (!kycValidationResult?.includes("passed")) {
      // Reject order if KYC not completed
      await client.rejectOrder({ orderId, reason: "KYC not completed" });
      console.log("Order rejected: KYC not completed");
      return;
    }

    // 4. Get phone validation result
    const phoneData = await client.getPhone({ userPK, secretKey });
    if (!phoneData.verified) {
      // Reject order if phone not verified
      await client.rejectOrder({ orderId, reason: "Phone not verified" });
      console.log("Order rejected: Phone not verified");
      return;
    }

    // 5. Get email validation result
    const emailData = await client.getEmail({ userPK, secretKey });
    if (!emailData.verified) {
      // Reject order if email not verified
      await client.rejectOrder({ orderId, reason: "Email not verified" });
      console.log("Order rejected: Email not verified");
      return;
    }

    const { cryptoAmount, cryptoCurrency, fiatAmount, fiatCurrency } = order;

    // 7. Do sanity checks on the order, confirm if you can process the order
    // This is a placeholder for your own logic
    const canProcessOrder = true;

    // 8. If you can't process the order, reject the order
    if (!canProcessOrder) {
      await client.rejectOrder({ orderId, reason: "Unable to process order" });
      console.log("Order rejected: Unable to process order");
      return;
    }

    // 9. If you can process the order, accept the order
    await client.acceptOnRampOrder({
      orderId,
      bankName: "Your Bank Name",
      bankAccount: "Your Bank Account",
    });
    console.log("Order accepted successfully");

    // 10. After processing the order (e.g., sending the fiat), complete the order
    // This is just an example, you would do this after actually processing the payment
    await client.completeOnRampOrder({
      orderId,
      transactionId: "Your transaction ID",
    });
    console.log("Order completed successfully");
  } catch (error) {
    console.error("Error in webhook handler:", error);
    throw error;
  }
}
