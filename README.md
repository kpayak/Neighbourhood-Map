# Neighbourhood-Map Project
## Developed by: Keyur Payak
## Project Description
1. Gather user's location. If location services are disabled a default location is set in San Francisco. User's location is shown using a blue marker on map.
2. Use Google Text Search API to find restaurants/cafe nearby and show them on google map using markers and in a list view in a panel.
3. Clicking on a place in list view will show a info window on map showing place details.
4. For each place, its address, phone number, hours are shown. Additionally FourSquare API is used to gather current places' rating and photos. 
5. A input box is used to filter by just typing. Once a user types, filtered results are shown by updating markers and list of places in the main panel.
6. If user wants to search for anything else, then type in input box and either click the search icon or press enter. 
7. This will use Google Nearby Search and FourSquare to gather information about searched place and update google map and list of places in main panel.

#### This application uses Google and FourSquare API to gather and show results on map and list view.

## How to Run:
1. Download/Clone this git repo.
 ```bash
  $> cd /path/to/your-project-folder/dist/
  $> python -m SimpleHTTPServer 8080
  ```
  
2. Open index.html file to run application.
