
const GROUPS = ["A","B","C", "D", "E"];

const USER_TO_GROUPS = {
    "u1":["A", "B", "C", "D", "E"],
    "u2":["A", "B"],
    "u3":["C"],
    "u4":["D"],
    "u5":["E"]
}

function standard_permissions(name) {
    return ["R", "W","RC", "WC"];
}
const GROUP_TO_PERMISSIONS = {
    "A": standard_permissions("A"),
    "B": standard_permissions("B"),
    "C": standard_permissions("C"),
    "D": standard_permissions("D"),
    "E": standard_permissions("E"),
}

const GROUP_TO_MACHINE = {
    "A":  "172.31.0.2",
    "B":  "172.31.0.3",
    "C":  "172.31.0.4",
    "D":  "172.31.0.5",
    "E":  "172.31.0.6"
}

function get_group_machine_address(group) {
    return GROUP_TO_MACHINE[group];
}

function is_user_in_group(user, group) {
    const groups = USER_TO_GROUPS[user]
    return (groups.find(
        (g)=>{ return group === g}
    ) !== undefined)
}

function get_csv_cloud_metadata(user) {
    let metadata = "Groups:\n";

            let gp = GROUPS.reduce( (str, g) => {
                if (is_user_in_group(user, g)) {
                     return str+= `${g}: RW\n`
                }
                else {
                    return str += `${g}: R\n`
                }
            }, "");
            metadata+=gp;

            metadata += "Users:\n"
            metadata += `${user}: RW\n`

    return metadata;
}

function authorize_action(user, action, group_owns_device=null) {

    console.log(`Authorizing ${user} for ${action}`);

    let groups = USER_TO_GROUPS[user];

    if (groups !== undefined) {
        console.log(`${user} is in groups ${groups}`)

        if (group_owns_device !== null) { // R/W to local device, owned by a group

            let a = is_user_in_group(user, group_owns_device)
            console.log(' Is user in the group that owns this device? '+a)

            if (a) { // User is in this group
                console.log('in');
                // Does membership in this group giver permission to R/W to its local device? (always yes)
                const approved = (GROUP_TO_PERMISSIONS[group_owns_device].find((permissions) => (permissions === action)) !== undefined);
                if (!approved) {
                    console.log(`User: ${user} is in group ${group_owns_device}, that does not have ${action} permissions to this local device!`);
                }
                else {
                    console.log(`User: ${user} is in group ${group_owns_device}, and has been approved to ${action} group ${group_owns_device} local device!`)
                }
                return approved;
            }
            else {
                // User is not in this group
                // Why is it not running this print statement? JavaScript what the fuck lol?
                console.log('User: '+user+' is not authorized to access information on a group '+group+' device!');
                // It just really doesn;t like this print statement for some reason...
                // Query results are the same each time, but it kind of runs however it wants lol.
                return a;
            }
        }
        else { // R/W to cloud
            // If at least one of these groups offers the WC/RC permission to cloud this will be approved
            const approved = groups.reduce( (at_least_one_permission_exists, group) => {
                const permission_exists_in_group = GROUP_TO_PERMISSIONS[group].find(
                    (permission) => { 
                        if (permission === action) {
                            return permission
                        }
                    }) !== undefined;
                //console.log(`Group ${group} has ${action} permissions? ${permission_exists_in_group}`);
                return at_least_one_permission_exists | permission_exists_in_group;
            }, false);

            if (!approved) {
                console.log(`User: ${user} is not in any groups that give ${action} permissions to the cloud!`)
            }
            else {
                console.log(`User: ${user} has been approved to ${action} to the cloud!`)
            }
            return approved;
        }
    }
    else {
        console.log(`User: ${user} is not in any groups`);
        return false;
    }
    

}

export default {authorize_action, get_csv_cloud_metadata, get_group_machine_address}