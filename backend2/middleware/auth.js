const jwt = require('jsonwebtoken');


//middleware qui vérifie le token de l'utilisateur
module.exports = (req, res, next) => {
   try {
        // On vérifie que le header Authorization est présent dans la requete
        const { headers } = req;
        if (!headers || !headers.authorization) {
          return res.status(401).json({
            message: 'Missing Authorization header'
          });
        }

        //on vérifie que le header Authorization contient bien le token
        const [scheme, token] = headers.authorization.split(' ');

        if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
          return res.status(401).json({
            message: 'Header format is Authorization: Bearer token'
          });
        }

        //on vérifie et décode le token à l'aide du secret 
        const jwtToken = jwt.verify(token, 'RANDOM_TOKEN_SECRET');

        //on vérifie que l'utilisateur existe dans la base de donnée
        const userId = jwtToken.userId;
        const userIsAdmin = jwtToken.isAdmin;

        const mysql = require('mysql');

        const connection = mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database:"groupomania"
        });

        connection.connect();

        const queryString = 'SELECT id FROM User WHERE id=?'
        const insert = [userId]
        const user = connection.query(queryString, insert, (error, result, fields) => {
          if (error) {
            return res.status(500).json({error: "mysql"});
          } else {
              if (!result[0]) {
                  return res.status(400).json({error: 'l\'utilisateur n\'existe pas.'});
              } 
          }
        });

        //On passe l'utilisateur dnas notre requete afin que celui-ci soit disponible pour les prochains middlewares
        req.user = userId;
        req.userIsAdmin = userIsAdmin

        //On appelle le prochain middleware
        return next();
    } catch (err) {    
        return res.status(401).json({
          message: 'Invalid token'
        });    
    }
};



