import express from "express";
import cors from "cors";
import db from "./config/db.js"; // Import your database connection from db.js
import sgMail from '@sendgrid/mail';
import Stripe from 'stripe';
import fetch from "node-fetch";
import https from 'https';
import fs from 'fs';





const app = express();
const sendgridApiKey = '';



// parse requests of content-type - application/json
//app.use(express.json());
app.use(express.json({ limit: '50mb' }));
// parse requests of content-type - application/x-www-form-urlencoded
//app.use(express.urlencoded({ extended: true }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));



// Add Access Control Allow Origin headers
app.use(cors());

// Set the SendGrid API key
sgMail.setApiKey(sendgridApiKey);

const privateKey = fs.readFileSync('/etc/letsencrypt/live/malh.fun/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/malh.fun/fullchain.pem', 'utf8');

const credentials = { key: privateKey, cert: certificate };


const httpsServer = https.createServer(credentials, app);


app.get("/api/users/:userId", (req, res) => {
    const userId = req.params.userId;

    db.query("SELECT * FROM portifolio WHERE user = ? LIMIT 1", [userId], (error, results) => {
        if (error) {
            //console.error("Error fetching updated user data:", error);
            res.status(500).json({ message: "Error fetching updated user data" });
        } else {
            //console.log("Business data fetched successfully");

            // Construct the response object with the desired properties
            const responseObject = results.length > 0
                ? {
                    id: results[0].id,
                    rates: results[0].rates,
                    about: results[0].about,
                    terms: results[0].terms,
                    name: results[0].name,
                    country: results[0].country,
                    whatsapp: results[0].whatsapp,
                    email: results[0].email,
                    phone: results[0].phone,
                    user: results[0].user,
                    city: results[0].city,
                    address: results[0].address,
                    note: results[0].note,
                    category: results[0].category,
                    photo_data: results[0].photo_data,
                    // Add other properties as needed
                  }
                : {}; // Empty object if no results

            // Send the constructed object as a JSON response
            res.status(200).json(responseObject);
        }
    });
});







//Buusiness functions
app.post("/api/business/create", (req, res) => {
    // Parse the JSON data from the request body

    const formData = req.body;
   // console.log('Received Form Data:', formData);
    const Data = [formData.businessName,formData.Rates,formData.Note,formData.Category,formData.Terms,formData.About,formData.Country,formData.City,formData.Address,formData.Email,formData.Whatsapp,formData.userId,formData.Phone,formData.Logo];
   

    // Perform user registration logic (insert data into the database)
    // Replace the following lines with your actual user registration code
    db.query("INSERT INTO portifolio (name, rates, note, category, terms, about, country, city, address, email, whatsapp, user, phone, photo_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", Data,
    (error, results) => {
            if (error) {
               // console.error("Error:", error);
                res.status(500).json({ message: "Error" });
            } else {
                //console.log("Profile successfully");
                // Clear the session storage
                //  req.session.formData = null; // Replace 'formData' with your actual session variable name
                res.status(200).json({ message: "Profile successfully" });
            }
        });
});
// update the business profile table





app.post("/api/business/update", (req, res) => {
    const formData = req.body;
   
   // console.log(formData);

    // Create an array to hold the SET clauses for the SQL query
    const setClauses = [];

    // Create an array to hold the values for the SQL query
    const values = [];

    // Function to add a clause to the setClauses array and push the value to the values array
    const addClause = (field, value) => {
        if (value !== undefined && value !== null && value !== '') {
            setClauses.push(`${field}=?`);
            values.push(value);
        }
    };

   
  // Add clauses for each field
  addClause('name', formData.businessName);
  addClause('rates', formData.Rates);
  addClause('note', formData.Note);
  addClause('category', formData.Category);
  addClause('terms', formData.Terms);
  addClause('about', formData.About);
  addClause('country', formData.Country);
  addClause('city', formData.City);
  addClause('address', formData.Address);
  addClause('email', formData.Email);
  addClause('whatsapp', formData.Whatsapp);
  addClause('phone', formData.Phone);
  addClause('photo_data', formData.Logo);
    // If there are fields to update, perform the update
    if (setClauses.length > 0) {
        const setClause = setClauses.join(', ');

        // Perform user update logic (update data in the database)
        const query = `UPDATE portifolio SET ${setClause} WHERE user=${formData.userId}`;

        db.query(query, values, (error, results) => {
            if (error) {
                //console.error("Error updating user:", error);
                res.status(500).json({ message: "Error updating user" });
            } else {
               // console.log("User updated successfully");
                res.status(200).json({ message: "success" });
            }
        });
    } else {
        // No fields to update
        res.status(400).json({ message: "No fields to update" });
    }
});

//Delete business profile
//Delete request
app.post("/api/business/delete", (req, res) => {
    const formData = req.body;
    //console.log(formData)

    // Perform user delete logic (delete data from the database)
    const query = `DELETE FROM portifolio WHERE id = ?`;

    db.query(query, [formData.businessId], (error, results) => {
        if (error) {
           // console.error("Error deleting user:", error);
            res.status(500).json({ message: "Error deleting user" });
        } else {
           // console.log("deleted successfully");
            res.status(200).json({ message: "deleted" });
        }
    });
});

//payments

// This example sets up an endpoint using the Express framework.
// Watch this video to get started: https://youtu.be/rPR2aJ6XnAc.



app.post('/api/stripe', async (req, res) => {
 
    
    const stripe = new Stripe('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');
    //console.log(req.body);
    const items = {
        userId: req.body.userId,
       
       
    };
    
    try {
        const encodedData = encodeURIComponent(JSON.stringify(items));
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Moneyhive monthly subscription',
                        },
                        unit_amount: req.body.price,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `https://malh.fun:4000/success?data=${encodedData}`,
            cancel_url: 'https://malh.fun:4000/cancel',
        });

        // Send the session URL back to the client
        res.json({ url: session.url });
    } catch (error) {
        //console.error('Error creating Stripe session:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


//responses
app.get('/success', (req, res) => {
    const customer = JSON.parse(req.query.data);
    //console.log(customer);


    // Get userId from request or session
    // const userId = req.body.userId; // Assuming userId is sent in the request body

    // Update the user status in the MySQL table
    const updateQuery = 'UPDATE users SET status = ?, payment_date = ? WHERE id = ?';
    const currentDate = new Date();
    
    db.query(updateQuery, ['premium', currentDate, customer.userId], (updateErr, updateResult) => {
        if (updateErr) {
            //console.error('Error updating MySQL table:', updateErr);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            //console.log('User status updated successfully');
            // Redirect or send a response as needed
            res.redirect('https://moneyhive-mw.com/success.html'); // Redirect to your dashboard or another page
        }
    });
    
});
//Paypal
// PayPal integration routes
app.post('/create_order', async (req, res) => {
    try {
        const { userId, price } = req.body;

        // Call your PayPal integration function or logic here
        const paypalOrder = await createPayPalOrder(userId, price);

        // Send the PayPal order details to the client
        res.json({
            id: paypalOrder.id,
            url: paypalOrder.links[1].href, // Assuming the PayPal checkout URL is available in the response
        });
    } catch (error) {
        //console.error('Error creating PayPal order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Helper function for creating a PayPal order
async function createPayPalOrder(userId, price) {
    const item = {
        userId: userId,         
    };
    const encodedData = encodeURIComponent(JSON.stringify(item));
    try {
        const accessToken = await getAccessToken();
        const successUrl = `https://malh.fun:4000/success?data=${encodedData}`;
        const orderData = {
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: 'USD',
                    value: price,
                },
                
            }],
            // Add the success URL here
            redirect_urls: {
                return_url: successUrl,
            },
        };

        const response = await fetch('https://api-m.paypal.com/v2/checkout/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify(orderData),
        });

        if (!response.ok) {
            throw new Error(`Error creating PayPal order. Status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        //console.error('Error creating PayPal order:', error);
        throw error;
    }
}

// Helper function for getting PayPal API access token
async function getAccessToken() {
    try {
        // Implement your logic for getting the PayPal API access token
        // This is a placeholder and should be replaced with your actual PayPal integration code
        const clientId = 'AV7jaxbg2TgqCkJqMv32qWjG8J600-L1RkhFdSC1jtrDSmDchbgXx6QLmxirolUHMOWXOYDjCXAFLdfu';
        const clientSecret = 'EPX0Qhv0tN1Yfnp01_-igZ_YMddGUgGKFxEIP645YID3nBjsFpIe9vSemjr8_3xHyYyPGXeHiRUJKNix';
        const auth = `${clientId}:${clientSecret}`;
        const data = 'grant_type=client_credentials';

        const response = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(auth).toString('base64')}`,
            },
            body: data,
        });

        if (!response.ok) {
            throw new Error(`Error getting PayPal access token. Status: ${response.status}`);
        }

        const json = await response.json();
        return json.access_token;
    } catch (error) {
        //console.error('Error getting PayPal access token:', error);
        throw error;
    }
}

app.get('/cancel', (req, res) =>{
     res.redirect('https://moneyhive-mw.com/cancel.html');
})

// set port, listen for requests
const PORT = 4000;
httpsServer.listen(PORT, () => {
    console.log(`Server running on https://moneyhive-mw.com:${PORT}`);
  });

/*
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
    console.log(sendgridApiKey);
});
*/