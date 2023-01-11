CREATE TABLE users (
  user_id INT GENERATED ALWAYS AS IDENTITY,
  username VARCHAR(25) UNIQUE,
  password TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL
    CHECK (position('@' IN email) > 1),
  location TEXT NULL,
  bio TEXT NULL,
  image_url TEXT NULL,
  created_dt TIMESTAMP NOT NULL DEFAULT NOW(),
  last_updated_dt TIMESTAMP NULL,
  active BOOLEAN NOT NULL,
  PRIMARY KEY(user_id)
);

CREATE TABLE user_connections (
  connection_id INT GENERATED ALWAYS AS IDENTITY,
  connector_user_id INT NOT NULL,
  connectee_user_id INT NOT NULL,
  created_dt TIMESTAMP NOT NULL DEFAULT NOW(),
  last_updated_dt TIMESTAMP NULL,
  status SMALLINT NOT NULL,
  active BOOLEAN NOT NULL,
  PRIMARY KEY(connection_id),
  CONSTRAINT fk_connector_user_id
    FOREIGN KEY(connector_user_id)
      REFERENCES users(user_id),
  CONSTRAINT fk_connectee_user_id
    FOREIGN KEY(connectee_user_id)
      REFERENCES users(user_id)
);

CREATE TABLE follows (
  follow_id INT GENERATED ALWAYS AS IDENTITY,
  user_id INT NOT NULL,
  superhero_id INT NOT NULL,
  created_dt TIMESTAMP NOT NULL DEFAULT NOW(),
  last_updated_dt TIMESTAMP NULL,
  active BOOLEAN NOT NULL,
  PRIMARY KEY(follow_id),
  CONSTRAINT fk_user_id
    FOREIGN KEY(user_id)
      REFERENCES users(user_id)
);

CREATE TABLE likes (
  like_id INT GENERATED ALWAYS AS IDENTITY,
  user_id INT NOT NULL,
  username VARCHAR(25) NOT NULL,
  superhero_id INT NOT NULL,
  created_dt TIMESTAMP NOT NULL DEFAULT NOW(),
  last_updated_dt TIMESTAMP NULL,
  active BOOLEAN NOT NULL,
  PRIMARY KEY(like_id),
  CONSTRAINT fk_user_id
    FOREIGN KEY(user_id)
      REFERENCES users(user_id)
);

CREATE TABLE recent_activity (
  activity_id INT GENERATED ALWAYS AS IDENTITY,
  user_id INT NOT NULL,
  username VARCHAR(25) NOT NULL,
  superhero_id INT NOT NULL,
  superhero_name TEXT NOT NULL,
  description TEXT NOT NULL,
  created_dt TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY(activity_id),
  CONSTRAINT fk_user_id
    FOREIGN KEY(user_id)
      REFERENCES users(user_id)
);

CREATE TABLE comments (
  comment_id INT GENERATED ALWAYS AS IDENTITY,
  user_id INT NOT NULL,
  superhero_id INT NOT NULL,
  comments TEXT NULL,
  created_dt TIMESTAMP NOT NULL DEFAULT NOW(),
  last_updated_dt TIMESTAMP NULL,
  active BOOLEAN NOT NULL,
  PRIMARY KEY(comment_id),
  CONSTRAINT fk_user_id
    FOREIGN KEY(user_id)
      REFERENCES users(user_id)
);

CREATE TABLE comment_likes (
  comment_like_id INT GENERATED ALWAYS AS IDENTITY,
  user_id INT NOT NULL,
  comment_id INT NOT NULL,
  created_dt TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY(comment_like_id),
  CONSTRAINT fk_user_id
    FOREIGN KEY(user_id)
      REFERENCES users(user_id),
  CONSTRAINT fk_comment_id
    FOREIGN KEY(comment_id)
      REFERENCES comments(comment_id)
);

CREATE TABLE images (
  image_url TEXT,
  user_id INT NOT NULL,
  superhero_id INT NOT NULL,
  created_dt TIMESTAMP NOT NULL DEFAULT NOW(),
  active BOOLEAN NOT NULL,
  PRIMARY KEY(image_url),
  CONSTRAINT fk_user_id
    FOREIGN KEY(user_id)
      REFERENCES users(user_id)
);

CREATE TABLE image_likes (
  image_like_id INT GENERATED ALWAYS AS IDENTITY,
  user_id INT NOT NULL,
  image_url TEXT NOT NULL,
  created_dt TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY(image_like_id),
  CONSTRAINT fk_user_id
    FOREIGN KEY(user_id)
      REFERENCES users(user_id)
);