import { XFlowPartnerClient } from "xflow-partner-client";
import nacl from "tweetnacl";
import base58 from "bs58";

export async function webhookHandler(body) {
  console.log("--- Webhook Example Usage ---");

  try {
    // Or you can use the Keypair for test purpose below
    // publicKey: 'F2etcaJ1HbPVjjKfp4WaZFF1DoQRNUETkXyM1b98u76C'
    // seed: 'GVb2FXnG64Xpr6KbWP6Jp4hXWSkWU4uL9AgBTsdBjnZp'
    const seed = "GVb2FXnG64Xpr6KbWP6Jp4hXWSkWU4uL9AgBTsdBjnZp";

    // Initialize partner client with your auth key pair
    const client = await XFlowPartnerClient.fromSeed(seed);

    const orderId = body.orderId;
    const order = await client.getOrder({ orderId: orderId });

    const userPK = order.userPublicKey;

    // Get user secret key
    const secretKey = await client.getUserSecretKey(userPK);

    // Get KYC result
    const kycValidationResult = await client.getValidationResult({
      key: "kycSmileId",
      secretKey: secretKey,
      userPK: userPK,
    });

    // KYC should return JSON result of validation. Ie: for Nigeria, it is SmileID result
    // For now, in Test Environment, we don't validate the KYC result
    // In Production, you will be able validate the KYC result and reject the order if the KYC is not valid

    const { cryptoAmount, cryptoCurrency, fiatAmount, fiatCurrency, type } = order;

    let canProcessOrder;

    // -------------------------------------------------------------------------------------------------
    // HERE IS WHERE YOU CAN ADD YOUR OWN LOGIC TO PROCESS THE ORDER
    // -------------------------------------------------------------------------------------------------

    if (type === "ON_RAMP") {
      // On-Ramp order
      // You should check the here that:
      // cryptoAmount, cryptoCurrency, fiatAmount, fiatCurrency are correct and match your exchange rates
      // And decide if you can process the order
      canProcessOrder = true;
      if (!canProcessOrder) {
        await client.rejectOrder({ orderId, reason: "Unable to process order" });
        console.log("Order rejected: Unable to process order");
        return;
      }

      // Once you are ready to create the order, you can create your order into your own system
      // And then accept the order here
      await client.acceptOnRampOrder({
        orderId,
        bankName: "Your Bank Name2", // This is the bank name that will be displayed to the user in the app
        bankAccount: "Your Bank Account2", // This is the bank account that will be displayed to the user in the app
        externalId: "EXTERNAL_ID", // This is ID that you will use to identify the order in your own system
      });
      console.log("On-Ramp order accepted successfully");
    } else if (type === "OFF_RAMP") {
      // Off-Ramp order
      // You should check the here that:
      // cryptoAmount, cryptoCurrency, fiatAmount, fiatCurrency are correct and match your exchange rates
      // And decide if you can process the order
      canProcessOrder = true;
      if (!canProcessOrder) {
        await client.rejectOrder({ orderId, reason: "Unable to process order" });
        console.log("Order rejected: Unable to process order");
        return;
      }

      // Once you are ready to create the order, you can create your order into your own system
      // And then accept the order here
      await client.acceptOffRampOrder({
        orderId,
        cryptoWalletAddress: "CRYPTO_WALLET_ADDRESS",
        externalId: "EXTERNAL_ID",
      });
      console.log("Off-Ramp order accepted successfully");
    }

    // -------------------------------------------------------------------------------------------------
    // END OF YOUR LOGIC
    // -------------------------------------------------------------------------------------------------
  } catch (error) {
    console.error("Error in webhook handler:", error);
    throw error;
  }
}
