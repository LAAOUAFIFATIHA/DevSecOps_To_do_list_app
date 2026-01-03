db = db.getSiblingDB('mongotask');

db.createUser({
    user: 'zh',
    pwd: 'test',
    roles: [{ role: 'readWrite', db: 'mongotask' }]
});

db.createUser({
    user: 'ziyati',
    pwd: 'test',
    roles: [{ role: 'readWrite', db: 'mongotask' }]
});

db.tasks.insertMany([
    { title: "course" },
    { title: "training" },
    { title: "pause" }
]);
