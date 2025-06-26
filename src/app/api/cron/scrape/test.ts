async function testCronEndpoint() {
  try {
    console.log('Testing cron endpoint...');

    // Helper function to safely parse response
    async function getResponseData(response: Response) {
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (error) {
        return { error: 'Failed to parse response', status: response.status, text };
      }
    }

    // Test without auth header (should fail)
    const noAuthResponse = await fetch('http://localhost:3000/api/cron/scrape');
    console.log('\nNo auth header response:', await getResponseData(noAuthResponse));

    // Test with invalid auth header (should fail)
    const invalidAuthResponse = await fetch('http://localhost:3000/api/cron/scrape', {
      headers: {
        'Authorization': 'Bearer invalid_secret'
      }
    });
    console.log('\nInvalid auth header response:', await getResponseData(invalidAuthResponse));

    // Test with valid auth header (should succeed)
    const validAuthResponse = await fetch('http://localhost:3000/api/cron/scrape', {
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      }
    });
    console.log('\nValid auth header response:', await getResponseData(validAuthResponse));

    // Test rate limiting (should be blocked)
    const rateLimitResponse = await fetch('http://localhost:3000/api/cron/scrape', {
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      }
    });
    console.log('\nRate limit test response:', await getResponseData(rateLimitResponse));

  } catch (error) {
    console.error('Error testing cron endpoint:', error);
  }
}

testCronEndpoint(); 