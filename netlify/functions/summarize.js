exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  let body;
  try {
    body = JSON.parse(event.body);
  } catch(e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'JSON invalide' }) };
  }

  const { apiKey, filename, text } = body;
  if (!apiKey || !text) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Paramètres manquants' }) };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Voici le contenu du document "${filename}".\n\nGénère un résumé structuré :\n- Une ligne de titre en MAJUSCULES\n- Des bullet points commençant par •\n- Maximum 10 points, phrases courtes\n- Uniquement ce document\n\nCONTENU :\n${text.slice(0, 12000)}`
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const msg = data?.error?.message || `Erreur API ${response.status}`;
      return { statusCode: response.status, headers, body: JSON.stringify({ error: msg }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ summary: data.content[0].text })
    };

  } catch(e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
