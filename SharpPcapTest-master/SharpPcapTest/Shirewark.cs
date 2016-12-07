/**
 * @Author: Tyler DeFoor
 * @Date: 12/3/2016
 * @Version: 3.1
 * @Summary: Sniffs all IP/TCP traffic coming through a system and sends relevant info to server
 * 
 * 
 * @License
 * This project was made thanks to SharpPcap, an open source and free license library.
 * Use is protected by the GNU Leser General Public License outlined in LICENSE.txt
 * This program is purely academic and will not be used in any shape or form for monetary profit
 * 
 * 
 */



using System;
using System.Collections.Generic;
using SharpPcap;
using System.Net;
using System.IO;
using System.Web.Script.Serialization;



namespace SharpPcapTest
{
    public class ShireWark
    {
        //Dictionary for directional number of times a source has sent a packet to a destination
        //String is in format "SourceIP DestinationIP"
        private static Dictionary<string, int[]> timesVisited = new Dictionary<string, int[]>();

        //Address of the server
        private static string URL = "https://2iyjl40fvc.execute-api.us-west-2.amazonaws.com/prod";

        //The start of the program used for timing purposes
        private static DateTime now = new DateTime();

        //Amount of seconds between POSTs
        private static int segmentTime = 1;
 
        public static void Main(string[] args)
        {

            /* VARIABLE DECLARATIONS */

            //The filter string to select what type of packets to capture
            const string FILTER = "ip and tcp";

            //Array of devices available to program
            var devices = CaptureDeviceList.Instance;

            /* END OF VARIABLE DECLARATIONS */

            // If no devices were found print an error
            if (devices.Count < 1)
            {
                Console.WriteLine("No devices were found on this machine");
                return;
            }

            //Give i a default value
            int currentDevice = 0;

            // Scan the list printing every entry
            foreach (var dev in devices)
            {
                //Print out the available devices
                Console.WriteLine("{0}) {1}", currentDevice, dev.Description);
                currentDevice++;
            }

            //Choose the device
            Console.WriteLine();
            Console.Write("-- Please choose a device to capture: ");
            currentDevice = int.Parse(Console.ReadLine());

            //Set the Device
            var device = devices[currentDevice];

            //Register our handler function to the 'packet arrival' event
            device.OnPacketArrival +=
                new PacketArrivalEventHandler(device_OnPacketArrival);

            //Open the device for capturing
            int readTimeoutMilliseconds = 10000;

            //Opens the device to read all traffic through machine
            //Waits a maximum of readTimeoutMilliseconds ms
            device.Open(DeviceMode.Promiscuous, readTimeoutMilliseconds);

            //tcpdump filter to capture only TCP/IP packets
            device.Filter = FILTER;

            //Start the ghetto timer
            now = DateTime.Now;

            //Start capture packets
            device.Capture();

            //Close the pcap device
            device.Close();
        }

        /*
        *@brief Describes what to do when a packet is caught
        *@param sender - The object that is sending the packet. Not used in this implementatino
        *@param e - The event arguments for the action, in this case a packet
        *@pre Program has an open, valid device and is capturing packets
        *@post Nothing in the packet is modified and program can continue capturing packets
        */
        private static void device_OnPacketArrival(object sender, CaptureEventArgs e)
        {            
            /* VARIABLE DECLARATION */

            //Get the length of the packet
            var length = e.Packet.Data.Length;

            //Store the packet in a PacketDotNet Packet
            var packet = PacketDotNet.Packet.ParsePacket(e.Packet.LinkLayerType, e.Packet.Data);

            //Transform packet to tcpPacket
            var tcpPacket = PacketDotNet.TcpPacket.GetEncapsulated(packet);

            /* END OF VARIABLE DECLARATIONS */

            //Make sure tcpPacket isn't null
            if (tcpPacket != null)
            {
                //Cast tcpPacket as ipPacket to get source and destination
                var ipPacket = (PacketDotNet.IpPacket)tcpPacket.ParentPacket;
                System.Net.IPAddress source = ipPacket.SourceAddress;
                System.Net.IPAddress dest = ipPacket.DestinationAddress;

                //The dictionary stores strings of the format "SourceIP DestIP"
                string toDictionary = source + " " + dest;

                //Increment or add toDictionary to the dictionary
                increment(toDictionary, length);

                //If it has be segmentTime seconds since last sending
                if (timeToSend())
                {
                    //Send to the server
                    toServer();

                    //Set the current time for reference
                    now = DateTime.Now;
                }
            }
        }

        /*
        *@brief Increments value with key current or adds current to dictionary with value 1
        *@param current - The string to add or increment in dictionary
        *@pre Dictionary is instantiated and current holds valid string
        *@post Dictionary is modified to include current or current is incremented
        */
        private static void increment ( string current, int length )
        {
            /* VARIABLE DECLARATION */

            //Value of int in Dictionary for that string
            int count = 1;

            /* END OF VARIABLE DECLARATION */

            //If we can get a value from current
            if ( timesVisited.ContainsKey( current ) )
            {
                //Get the current count
                count = timesVisited[current][0];

                //Get the current length
                int tempLength = timesVisited[current][1];

                //Set a temporary array containing an incremented count and length
                int[] tempArray = { count + 1, tempLength + length };

                //Sets the value of the dictionary key current to tempArray
                timesVisited[current] = tempArray;
            }
            //Otherwise
            else
            {
                //Create a temporary array to hold count and length
                int[] tempArray = { count, length };

                //Add key current to the dictionary with value tempArray
                timesVisited.Add(current, tempArray);
            }
        }

        /*
        *@brief Adds json data to server
        *@param length - The length of the packet
        *@param sourceIP - The source IP
        *@param destIP - The destination IP
        *@param count - Number of tracked packets from source to destinatino
        *@pre A TCP packet has been analyzed and relevant information is stored in v ariables
        *@post Json object is stored on server. Nothing in variables are changed
        */
        private static void toServer (  )
        {
            //Create the WebRequest
            var httpWebRequest = (HttpWebRequest)WebRequest.Create(URL);

            //Set the content type
            httpWebRequest.ContentType = "application/json";

            //We are posting data
            httpWebRequest.Method = "POST";

            //Get the key collection
            Dictionary<string, int[]>.KeyCollection keys = timesVisited.Keys;

            //Create string json with the start to an array of objects
            string json = "{\"events\":[";

            //Loop through all keys, storing the string in current
            foreach ( string current in keys)
            {
                //Find the space in the key
                int space = current.IndexOf(' ');

                //Get the string substring before the first space, which is the source IP
                string tempSource = current.Substring(0, space);

                //Get the substring after the space, which is the destination IP
                string tempDest = current.Substring(space + 1);

                //Get Num_packets and Size_packets from the dictionary
                int[] temp = timesVisited[current];
                int num_Packets = temp[0];
                int size_Packets = temp[1];

                //Serialize a JSON object 
                //Comes out to {"source":tempSource,"dest":tempDest,"Num_packets":num_Packets,"Size_packets":size_Packets}
                string tempJSON = new JavaScriptSerializer().Serialize(new
                {
                    source = tempSource,
                    dest = tempDest,
                    Num_packets = num_Packets,
                    Size_packets = size_Packets

                });

                //Add that into the JSON array with a comma after
                json += tempJSON + ",";

            }

            //Remove the last comma
            json = json.Remove(json.Length - 1);

            //Put the ending thingy
            json += "]}";

            //Instantiate streamWriter for this section
            using (var streamWriter = new StreamWriter(httpWebRequest.GetRequestStream()))
            {
                //Write the object
                streamWriter.Write(json);
                
                //Flush the streamwriter
                streamWriter.Flush();

                //Close it out
                streamWriter.Close();
            }

            //Get the response
            var httpResponse = (HttpWebResponse)httpWebRequest.GetResponse();

            //Instantiate streamReader to get response
            using (var streamReader = new StreamReader(httpResponse.GetResponseStream()))
            {
                //Read to the end
                var result = streamReader.ReadToEnd();
            }

            timesVisited.Clear();
        }

        /*
        *@brief Checks to see if a previous time, represented as the variable now, was more the segmentTime
        *       seconds ago
        *@pre segmentTime is initiated and has a relevant data value
        *@post segmentTime and now is unchanged
        */
        private static bool timeToSend (  )
        {
            //Get the current time
            var rightNow = DateTime.Now;

            //Return if it has been two seconds or more since the DateTime variable now
            return ( rightNow.Subtract(now) >= TimeSpan.FromSeconds(segmentTime) ); 
        }

    }

}
