
const USER_TO_GROUP = {
    "u1":["A"],
    "u2":["A", "B"]
}

function standard_permissions(name) {
    return ["R", "W","GET", "POST"];
}
const GROUP_TO_PERMISSIONS = {
    "A": {
        machine_address: "172.31.0.2",
        permissions: standard_permissions("A")

    },
    "B": {
        machine_address: "172.31.0.4",
        permissions: standard_permissions("B")
    }
}

function authorize_action(user, type, group_owns_device=null) {

    let groups = USER_TO_GROUP[user];

    if (group_owns_device !== null) { // R/W to local device, owned by a group

        if (groups.find(group_owns_device)) { // User is in this group
            // Does membership in this group giver permission to R/W to its local device? (always yes)
            const approved = (GROUP_TO_PERMISSIONS[group_owns_device].permissions.find(type) !== undefined);

            if (!approved) {
                console.log(`User: ${user} is in group ${group_owns_device}, that does not have ${type} permissions to this local device!`);
            }

            return approved;
        }
        else { // User is not in this group
            console.log(`User: ${user} is not authorized to access information on a group ${group} device!`);
            return false;
        }
    }
    else { // R/W to cloud

        // If at least one of these groups offers the POST/GET permission to cloud this will be approved
        const approved = groups.reduce( (at_least_one_permission_exists, group) => {
            const permission_exists_in_group = group.permissions.find(type) !== undefined;
            return at_least_one_permission_exists | permission_exists_in_group;
        }, false);

        if (!approved) {
            console.log(`User: ${user} is not in any groups that give ${type} permissions to the cloud!`)
        }

        return approved;

    }

}