# Parameter declarations
$pfParam = $args[0]
$tfParam = $args[1]

# Admin folder creation function
# This function assumes that the inputs are already valid
function createAdminFolder([string]$targetFolder) {
    # Checks to see if there is already an Admin folder under the file path
    if(test-path "\\192.168.1.252\Survey\Projects\$pfParam\$targetFolder\Admin") {
        Write-Output "Admin folder already exists in project '$targetFolder'"
        return
    }
        
    if(test-path "\\192.168.1.252\Survey\Projects\$pfParam\$targetFolder\") {
        new-item "\\192.168.1.252\Survey\Projects\$pfParam\$targetFolder\Admin" -ItemType Directory -Force
        robocopy *.* /V /S /E /COPYALL /ZB /NP /R:10 /W:10 "\\192.168.1.252\Survey\Projects\Current-Jobs\Folder setup\Admin" "\\192.168.1.252\Survey\Projects\$pfParam\$targetFolder\Admin" @filename /np /ts /fp /mir /sec /LOG:"results.log" 
        Write-Output "Created an admin folder in the path S:\Projects\$pfParam\$targetFolder\"
        return
    } else {
        Write-Output "There was an error in creating the Admin folder under the path S:\Projects\$pfParam\$targetFolder\"
        return
    }
}

# Gets all of the projects under the parent project
$projectsUnderParent = Get-ChildItem "\\192.168.1.252\Survey\Projects\$pfParam" | Select-Object -ExpandProperty Name

function fuzzyFindChildProject([string]$userInput) {
    $count = 0

    # Interates over all of the folders under the parent directory to find folders that are like the user input
    foreach ($project in $projectsUnderParent) {
        if ($project -like "*$userInput*") {
            $count++
            $childFolder = $project
        }
    }

    # If there is more than one folder that is like the user input, then the user input is ambigious
    if ($count -ne 1) {
        return $null
    }

    # Returns the folder that is most like the under input 
    return $childFolder 
}

function main() {
    # Gets the exact name of the target folder
    $childFolder = fuzzyFindChildProject($tfParam)

    # Sends an alert to the user if the folder name is ambigious or does not exist
    if ($null -eq $childFolder) {
        Write-Output "The project '$tfParam' was ambigious or does not exist. Pleae input another project name. "
        return
    } 

    # Creates the admin folder in that path
    createAdminFolder($childFolder)
    return
}

Write-Host "After attempting to create an admin folder in '$tfParam': "

# Calls the main function with the user parameters
main