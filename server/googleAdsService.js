import dotenv from 'dotenv';
dotenv.config();

/**
 * Service to programmatically interact with Google Ads API (REST)
 */
export class GoogleAdsService {
  /**
   * Helper to retrieve a fresh OAuth Access Token using a Refresh Token
   */
  static async getAccessToken(clientId, clientSecret, refreshToken) {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error_description || 'Failed to refresh token');
      }

      const data = await response.json();
      return data.access_token;
    } catch (err) {
      console.error('[Google Ads API] Error obtaining OAuth token:', err.message);
      throw err;
    }
  }

  /**
   * Mutate campaign status in Google Ads Account
   */
  static async updateCampaignStatus(campaignId, status, brandSettings) {
    const isMock = !process.env.GOOGLE_ADS_CLIENT_ID || !process.env.GOOGLE_ADS_REFRESH_TOKEN;
    const targetStatus = status.toUpperCase() === 'ACTIVE' ? 'ENABLED' : 'PAUSED';

    // Account ID can be pulled from brand credentials or fall back to client account 979-695-4574
    const customerId = (process.env.GOOGLE_ADS_CUSTOMER_ID || '9796954574').replace(/-/g, '');
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || 'mock_dev_token';

    if (isMock) {
      console.log(`\n📢 [GOOGLE ADS API] [SIMULATION MODE]`);
      console.log(`👉 Target Account Customer ID: ${customerId}`);
      console.log(`👉 Mutate Campaign: customers/${customerId}/campaigns/${campaignId}`);
      console.log(`👉 Operation: Update status to [${targetStatus}]`);
      console.log(`👉 Status: Programmatic sync successful (Mocked Response)\n`);
      return { success: true, simulated: true };
    }

    try {
      const accessToken = await this.getAccessToken(
        process.env.GOOGLE_ADS_CLIENT_ID,
        process.env.GOOGLE_ADS_CLIENT_SECRET,
        process.env.GOOGLE_ADS_REFRESH_TOKEN
      );

      const url = `https://googleads.googleapis.com/v16/customers/${customerId}/campaigns:mutate`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': developerToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operations: [
            {
              update: {
                resourceName: `customers/${customerId}/campaigns/${campaignId}`,
                status: targetStatus
              },
              updateMask: 'status'
            }
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText);
      }

      console.log(`✅ [Google Ads API] Successfully synchronized status to ${targetStatus} for campaign ${campaignId}`);
      return await response.json();
    } catch (err) {
      console.error(`❌ [Google Ads API] Failed to sync status to Google Ads for campaign ${campaignId}:`, err.message);
      throw err;
    }
  }

  /**
   * Mutate campaign budget in Google Ads Account
   */
  static async updateCampaignBudget(campaignId, budgetId, newDailyBudget, brandSettings) {
    const isMock = !process.env.GOOGLE_ADS_CLIENT_ID || !process.env.GOOGLE_ADS_REFRESH_TOKEN;
    const customerId = (process.env.GOOGLE_ADS_CUSTOMER_ID || '9796954574').replace(/-/g, '');
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || 'mock_dev_token';
    
    // Google Ads API requires budget in micros (1 dollar = 1,000,000 micros)
    const amountMicros = Math.round(parseFloat(newDailyBudget) * 1000000);

    if (isMock) {
      console.log(`\n📢 [GOOGLE ADS API] [SIMULATION MODE]`);
      console.log(`👉 Target Account Customer ID: ${customerId}`);
      console.log(`👉 Mutate Budget: customers/${customerId}/campaignBudgets/${budgetId || 'default_budget'}`);
      console.log(`👉 Operation: Update Daily Budget to $${newDailyBudget.toFixed(2)} (${amountMicros} micros)`);
      console.log(`👉 Status: Programmatic sync successful (Mocked Response)\n`);
      return { success: true, simulated: true };
    }

    try {
      const accessToken = await this.getAccessToken(
        process.env.GOOGLE_ADS_CLIENT_ID,
        process.env.GOOGLE_ADS_CLIENT_SECRET,
        process.env.GOOGLE_ADS_REFRESH_TOKEN
      );

      const url = `https://googleads.googleapis.com/v16/customers/${customerId}/campaignBudgets:mutate`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': developerToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operations: [
            {
              update: {
                resourceName: `customers/${customerId}/campaignBudgets/${budgetId}`,
                amountMicros: amountMicros.toString()
              },
              updateMask: 'amountMicros'
            }
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText);
      }

      console.log(`✅ [Google Ads API] Successfully synchronized budget update ($${newDailyBudget}) for budget ID ${budgetId}`);
      return await response.json();
    } catch (err) {
      console.error(`❌ [Google Ads API] Failed to sync budget update to Google Ads:`, err.message);
      throw err;
    }
  }
}
