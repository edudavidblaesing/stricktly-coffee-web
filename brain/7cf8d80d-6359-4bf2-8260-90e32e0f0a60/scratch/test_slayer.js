async function test() {
    try {
        const url = 'https://slayerespresso.com/products.json?limit=250';
        console.log('Fetching:', url);
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        console.log('Status:', res.status);
        if (res.ok) {
            const data = await res.json();
            console.log('Product Count:', data.products ? data.products.length : 'undefined');
            if (data.products && data.products.length > 0) {
                console.log('First Product Title:', data.products[0].title);
            }
        } else {
            console.log('Error text:', await res.text());
        }
    } catch(e) {
        console.error('Fetch error:', e);
    }
}

test();
