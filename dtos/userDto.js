module.exports = class UserDto {
    firstName;
    secondName;
    patronymic;
    email;
    id;
    role;
    phoneNumber;
    userDiscount;
    isActivated;

    constructor(model) {
        this.firstName = model.firstName;
        this.secondName = model.secondName;
        this.patronymic = model.patronymic;
        this.email = model.email;
        this.role = model.role;
        this.phoneNumber = model.phoneNumber;
        this.id = model._id;
        this.isActivated = model.isActivated;
        this.userDiscount = model.userDiscount;
    }
}