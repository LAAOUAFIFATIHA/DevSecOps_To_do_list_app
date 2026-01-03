db = db.getSiblingDB('tododb');

db.createUser({
    user: 'zh',
    pwd: 'test',
    roles: [{ role: 'readWrite', db: 'tododb' }]
});

db.createUser({
    user: 'ziyati',
    pwd: 'test',
    roles: [{ role: 'readWrite', db: 'tododb' }]
});

db.tasks.insertMany([
    { title: "course" },
    { title: "training" },
    { title: "pause" }
]);
