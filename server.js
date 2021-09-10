const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const knex = require('knex');
const bcrypt = require('bcrypt');
const { response } = require('express');

const pg = knex({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        user: 'postgres',
        password: 'bobbyjr45',
        database: 'smartbrain'
    }
});


const app = express();

const database = {
    users: [
        {
            id: '123',
            name: 'John',
            email: 'john@gmail.com',
            password: 'cookies',
            entries: 0,
            joined: new Date()
        },
        {
            id: '124',
            name: 'Sally',
            email: 'sally@gmail.com',
            password: 'bananas',
            entries: 0,
            joined: new Date()
        },
    ]
}

app.use(bodyParser.json());
app.use(cors());


app.get('/', (req, res) => {
    res.send(database.users);
})

app.post('/signin', (req, res) => {
    pg.select('email', 'hash').from('login')
        .where('email', '=', req.body.email)
        .then(data => {
            console.log(data[0]);
            const isValid = bcrypt.compareSync(req.body.password, data[0].hash)
            console.log(isValid);
            if (isValid) {
                return pg.select('*').from('users')
                    .where('email', '=', req.body.email)
                    .then(user => {
                        console.log(user);
                        res.json(user[0]);
                    })
                    .catch(err => res.status(400).json('unable to get user'))
            }
            else {
                res.status(400).json('wrong credentials')
            }


        })
        .catch(err => res.status(400).json('wrong credentials'))
})

app.post('/register', (req, res) => {
    const { email, name, password } = req.body;
    const hash = bcrypt.hashSync(password, 10);
    pg.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email
        })
            .into('login')
            .returning('email')
            .then(loginEmail => {
                return trx('users')
                    .returning('*')
                    .insert({
                        email: loginEmail[0],
                        name: name,
                        joined: new Date()
                    })
                    .then(user => {
                        res.json(user[0]);

                    })
            })
            .then(trx.commit)
            .catch(trx.rollback)
    })
        .catch(err => res.status(400).json('Unable to register'))

})

app.get('/profile/:id', (req, res) => {
    const { id } = req.params;
    let found = false;
    pg.select('*').from('users').where({ id }).then(user => {
        if (user.length) {
            res.json(user[0]);
        }
        else {
            res.status(400).json('Error getting user')
        }

    })
})

app.put('/images', (req, res) => {
    const { id } = req.body;
    let found = false;
    pg('users').where('id', '=', id).increment('entries', 1).returning('entries').then(entries => {
        console.log(entries[0]);
        res.json(entries[0]);
    }).catch(err => res.status(400).jaon('unable to get entries'));
})

app.listen(3000, () => {
    console.log('app is unning on port 3000');
})