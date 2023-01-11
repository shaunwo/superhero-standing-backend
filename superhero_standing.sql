\echo 'Delete and recreate superhero_standing db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE superhero_standing;
CREATE DATABASE superhero_standing;
\connect superhero_standing

\i superhero_standing-schema.sql

\echo 'Delete and recreate superhero_standing_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE superhero_standing_test;
CREATE DATABASE superhero_standing_test;
\connect superhero_standing_test

\i superhero_standing-schema.sql
