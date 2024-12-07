import passport from 'passport';

const loginMiddleware = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).send({ message: 'Error logging in', error: err.message });
    }

    if (!user) {
      return res.status(401).send({ message: 'Invalid username or password' });
    }

    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).send({ message: 'Error logging in', error: err.message });
      }

      res.status(200).send({ message: 'Login successful', user });
    });
  })(req, res, next);
};

export default loginMiddleware;
