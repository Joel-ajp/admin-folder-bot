# Parameter declarations
$pfParam = $args[0]
$tfParam = $args[1]


function main() {
    # Gets the exact name of the target folder
    $childFolder = fuzzyFindChildProject($tfParam)

    # Sends an alert to the user if the folder name is ambigious or does not exist
    if ($null -eq $childFolder) {
        Write-Output "The project '$tfParam' was ambigious or does not exist. Pleae input another project name. "
        return
    } 

    # Returns the fuzzy found child folder
    Write-Output $childFolder
    return 
}

# Gets all of the projects under the parent project
$projectsUnderParent = Get-ChildItem "\\dfsdc.corp.rsquared.com\Survey\Projects\$pfParam" | Select-Object -ExpandProperty Name 

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

# Calls the main function with the user parameters
main