const filterObj = (obj, ...allowedFields) => {
    const newObj = ();
    Object.keys(obj).forEach((el) => {
        if(allowedFields(el)) newObj[el] = obj[el];
    })
};

module.exports = filterObj;

