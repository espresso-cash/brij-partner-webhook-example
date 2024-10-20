import { XFlowPartnerClient } from "xflow-partner-client";

export async function webhookHandler(body) {
  console.log("--- Webhook Example Usage ---");

  try {
    // You can use the following Keypair for test purpose:
    // - publicKey: 'F2etcaJ1HbPVjjKfp4WaZFF1DoQRNUETkXyM1b98u76C'
    // - seed: 'GVb2FXnG64Xpr6KbWP6Jp4hXWSkWU4uL9AgBTsdBjnZp'
    const seed = "GVb2FXnG64Xpr6KbWP6Jp4hXWSkWU4uL9AgBTsdBjnZp";

    // Initialize partner client with your auth key pair.
    const client = await XFlowPartnerClient.fromSeed(seed);

    const orderId = body.orderId;
    const order = await client.getOrder({ orderId: orderId });

    const userPK = order.userPublicKey;

    // Get user secret key.
    const secretKey = await client.getUserSecretKey(userPK);

    // KYC should return JSON result of validation, i.e. for Nigeria, it is
    // SmileID result. For now, in Test Environment, we don't validate the KYC
    // result. In Production, you will be able to validate the KYC result and
    // reject the order if the KYC is not valid.

    const userData = await client.getUserData({ userPK, secretKey });
    console.log(userData);
    // Example response:
    // {
    //   email: [
    //     {
    //       value: 'test@example.com',
    //       dataId: '20946f48-9068-453d-a124-a5f5d764b3cc',
    //       status: 'APPROVED'
    //     }
    //   ],
    //   phone: [
    //     {
    //       value: '+1234567890',
    //       dataId: 'b31b5b28-d55f-4eda-b20f-e581f0d16bfe',
    //       status: 'UNSPECIFIED'
    //     }
    //   ],
    //   name: [],
    //   birthDate: [],
    //   document: [],
    //   bankInfo: [],
    //   selfie: [],
    //   custom: {}
    // }

    const {
      cryptoAmount, cryptoCurrency, fiatAmount, fiatCurrency, type,
    } = order;
    console.log({
      cryptoAmount,
      cryptoCurrency,
      fiatAmount,
      fiatCurrency,
      type,
    });
    // Example response:
    // {
    //   cryptoAmount: '10000000',
    //   cryptoCurrency: 'USDC',
    //   fiatAmount: '15000',
    //   fiatCurrency: 'NGN',
    //   type: 'ON_RAMP'
    // }

    let canProcessOrder;

    // -------------------------------------------------------------------------
    // HERE YOU CAN ADD YOUR OWN LOGIC TO PROCESS THE ORDER
    // -------------------------------------------------------------------------

    if (type === "ON_RAMP") {
      // On-Ramp order
      // You should check the here that: cryptoAmount, cryptoCurrency,
      // fiatAmount, fiatCurrency are correct and match your exchange rates.
      // After that, you can decide if you can process the order.
      canProcessOrder = true;
      if (!canProcessOrder) {
        await client.rejectOrder({
          orderId, reason: "Unable to process order",
        });
        console.log("Order rejected: Unable to process order");
        return;
      }

      // Once you are ready to process the order, you can create the order in
      // your own system, and then accept the order here.
      await client.acceptOnRampOrder({
        orderId,
        // Bank name that will be displayed to the user in the app
        bankName: "Your Bank Name2",
        // Bank account that will be displayed to the user in the app
        bankAccount: "Your Bank Account2",
        // ID that you can use to identify the order in your own system
        externalId: Math.random().toString(),
      });
      console.log("On-Ramp order accepted successfully");
    } else if (type === "OFF_RAMP") {
      // Off-Ramp order
      // You should check the here that: cryptoAmount, cryptoCurrency,
      // fiatAmount, fiatCurrency are correct and match your exchange rates.
      // After that, you can decide if you can process the order.
      canProcessOrder = true;
      if (!canProcessOrder) {
        await client.rejectOrder({
          orderId, reason: "Unable to process order",
        });
        console.log("Order rejected: Unable to process order");
        return;
      }

      // Once you are ready to process the order, you can create the order in
      // your own system, and then accept the order here.
      await client.acceptOffRampOrder({
        orderId,
        cryptoWalletAddress: "CRYPTO_WALLET_ADDRESS",
        externalId: Math.random().toString(),
      });
      console.log("Off-Ramp order accepted successfully");
    }

    // -------------------------------------------------------------------------
    // END OF YOUR LOGIC
    // -------------------------------------------------------------------------
  } catch (error) {
    console.error("Error in webhook handler:", error);
    throw error;
  }
}
